import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { KIO } from './kio';
import { AutoCommitInterpreterImpl } from './adapter/autoCommitInterpreterImpl';
import { KintoneClientImpl } from './adapter/kintoneClientImpl';
import { TransactionalCommitInterpreterImpl } from './adapter/transactionalCommitInterpreterImpl';

export function start(underlyingClient: KintoneRestAPIClient) {
  const client = new KintoneClientImpl(underlyingClient);
  const autoCommitInterpreter = new AutoCommitInterpreterImpl(client);
  const transactionalCommitInterpreter = new TransactionalCommitInterpreterImpl(client);
  return KIO.instance(autoCommitInterpreter, transactionalCommitInterpreter);
}
