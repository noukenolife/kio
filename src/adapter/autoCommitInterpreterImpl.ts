import * as T from 'fp-ts/Task';
import * as O from 'fp-ts/Option';
import { Do } from 'fp-ts-contrib/Do';
import { KIOA } from '../kioa';
import { KintoneClient } from '../client/kintoneClient';
import { AutoCommitInterpreter } from '../interpreter/autoCommitInterpreter';

export class AutoCommitInterpreterImpl implements AutoCommitInterpreter {
  private client: KintoneClient;

  constructor(client: KintoneClient) {
    this.client = client;
  }

  readonly translate = <A>(kioa: KIOA<A>): T.Task<A> => {
    switch (kioa._tag) {
      case 'Async': return kioa.a;
      case 'GetRecordOpt': return Do(T.Monad)
        .bind('recordOpt', this.client.getRecordOpt(kioa))
        .return(({ recordOpt }) => kioa.f(recordOpt));
      case 'GetRecords': return Do(T.Monad)
        .bind('result', this.client.getRecords(kioa))
        .return(({ result }) => kioa.f(result.records));
      case 'AddRecord': return Do(T.Monad)
        .bind('result', this.client.addRecord(kioa))
        .return(({ result }) => kioa.f(O.some(result)));
      case 'UpdateRecord': return Do(T.Monad)
        .bind('result', this.client.updateRecord(kioa))
        .return(({ result }) => kioa.f(O.some(result)));
      case 'DeleteRecords': return Do(T.Monad)
        .bind('result', this.client.deleteRecords(kioa))
        .return(() => kioa.f());
      default: throw Error('Unknown operation.');
    }
  };
}
