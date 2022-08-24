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
    const record = {
      value: { value: 'aaaa' },
    };

    const result = await KIO
      .instance(autoCommitInterpreter)
      .addRecord({ tag: 'record1', app: '2', record })
      .getRecordOpt({ tag: 'record2', app: '2', id: '1' })
      .getRecordOpt({ tag: 'record3', app: '2', id: '9999' })
      .autoCommit(({ record1 }) => record1);
    console.log(result);
  });
});
