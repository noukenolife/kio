import * as T from 'fp-ts/Task';
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
      default: throw Error('Unknown operation.');
    }
  };
}
