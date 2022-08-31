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

  it.skip('test', async () => {
    type RecordType = {
      id: { value: string },
      field1: { value: string },
    };
    const record: RecordType = {
      id: { value: '9999' },
      field1: { value: 'aaaa' },
    };

    const result = await KIO
      .instance(autoCommitInterpreter)
      .addRecord('record1')<RecordType>({ app: '2', record })
      .getRecordOpt('record2')<RecordType>({ app: '2', id: '1' })
      .getRecordOpt('record3')<RecordType>({ app: '2', id: '9999' })
      .getRecords('records')<RecordType>({ app: '2' })
      .deleteRecords({ app: '2', records: [{ id: '1' }] })
      .map('record1')(async () => 1)
      .commit(({ record1 }) => record1);
    console.log(result);
  });
});
