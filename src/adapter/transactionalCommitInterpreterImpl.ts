import * as O from 'fp-ts/Option';
import * as T from 'fp-ts/Task';
import { Do } from 'fp-ts-contrib/Do';
import * as FR from 'fp-ts-contrib/Free';
import { KIOA } from '../kioa';
import { KintoneClient } from '../client/kintoneClient';
import * as TS from '../taskState';
import {
  KintoneUoW,
  pushAddRecordRequest,
  pushDeleteRecordsRequest,
  pushRecord,
  pushRecords,
  pushUpdateRecordRequest,
} from '../uow/kintoneUoW';
import { Record } from '../core';
import { Interpreter } from '../interpreter/interpreter';
import * as K from '../kioa';

export class TransactionalCommitInterpreterImpl implements Interpreter {
  private client: KintoneClient;

  constructor(client: KintoneClient) {
    this.client = client;
  }

  readonly kioToTaskState = <A>(kioa: KIOA<A>): TS.TaskState<KintoneUoW, A> => {
    switch (kioa._tag) {
      case 'Async': return TS.fromTask<KintoneUoW, A>(kioa.a);
      case 'GetRecordOpt': return Do(TS.Monad)
        .bind('recordOpt', TS.fromTask<KintoneUoW, O.Option<Record>>(this.client.getRecordOpt(kioa)))
        .bindL('updateUoW', ({ recordOpt }) => O.foldW<TS.TaskState<KintoneUoW, void>, Record, TS.TaskState<KintoneUoW, void>>(
          () => TS.of<void, KintoneUoW>(undefined),
          (record) => TS.fromState<KintoneUoW, void>(pushRecord(kioa.app, record)),
        )(recordOpt))
        .return(({ recordOpt }) => kioa.f(recordOpt));
      case 'GetRecords': return Do(TS.Monad)
        .bind('result', TS.fromTask<KintoneUoW, { records: Record[] }>(this.client.getRecords(kioa)))
        .bindL('updateUoW', ({ result }) => TS.fromState(pushRecords(kioa.app, result.records)))
        .return(({ result }) => kioa.f(result.records));
      case 'AddRecord': return Do(TS.Monad)
        .bind('updateUoW', TS.fromState(pushAddRecordRequest(kioa.app, kioa.record)))
        .return(() => kioa.f(O.none));
      case 'UpdateRecord': return Do(TS.Monad)
        .bind('updateUoW', TS.fromState(pushUpdateRecordRequest(kioa.app, kioa.record, kioa.id, kioa.updateKey)))
        .return(() => kioa.f(O.none));
      case 'DeleteRecords': return Do(TS.Monad)
        .bind('updateUoW', TS.fromState(pushDeleteRecordsRequest(kioa.app, kioa.records)))
        .return(() => kioa.f());
      default: throw Error('Unknown operation.');
    }
  };

  readonly translate = <A>(kio: FR.Free<K.URI, A>): T.Task<A> => Do(T.Monad)
    .bind('result', FR.foldFree(TS.Monad)(this.kioToTaskState, kio)({
      store: {},
      requests: [],
    }))
    .bindL('bulkRequest', ({ result }) => this.client.bulkRequest({ requests: result[1].requests }))
    .return(({ result }) => result[0]);
}
