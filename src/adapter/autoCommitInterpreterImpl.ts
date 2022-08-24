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
      case 'GetRecordOpt': return Do(T.Monad)
        .bind('recordOpt', this.client.getRecordOpt({ app: kioa.app, id: kioa.id }))
        .return(({ recordOpt }) => kioa.f(recordOpt));
      case 'AddRecord': return Do(T.Monad)
        .bind('result', this.client.addRecord({ app: kioa.app, record: kioa.record }))
        .return(({ result }) => kioa.f(O.some(result)));
      default: throw Error('Unknown operation.');
    }
  };
}
