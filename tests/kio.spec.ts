import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { KIO } from '../src/kio';
import { KintoneClientImpl } from '../src/adapter/kintoneClientImpl';
import { AutoCommitInterpreterImpl } from '../src/adapter/autoCommitInterpreterImpl';

describe('KIO', () => {
  const underlying = new KintoneRestAPIClient({
    baseUrl: process.env.KINTONE_API_BASE_URL,
    auth: {
      apiToken: process.env.KINTONE_TEST_APP_TOKEN,
    },
  });
  const client = new KintoneClientImpl(underlying);
  const autoCommitInterpreter = new AutoCommitInterpreterImpl(client);

  it('test', async () => {
    const test = await KIO
      .instance(autoCommitInterpreter)
      .getRecordOpt({ tag: 'record1', app: '2', id: '1' })
      .getRecordOpt({ tag: 'record2', app: '2', id: '9999' })
      .autoCommit(({ record2 }) => record2);
    console.log(test);
  });
});
