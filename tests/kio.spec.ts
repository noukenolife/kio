import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { ID } from '@kintone/rest-api-client/lib/KintoneFields/types/field';
import { KIO } from '../src/kio';
import { KintoneClientImpl } from '../src/adapter/kintoneClientImpl';
import { AutoCommitInterpreterImpl } from '../src/adapter/autoCommitInterpreterImpl';
import { TransactionalCommitInterpreterImpl } from '../src/adapter/transactionalCommitInterpreterImpl';

describe('KIO', () => {
  const APP_ID = process.env.KINTONE_TEST_APP_ID ?? '';
  const underlying = new KintoneRestAPIClient({
    baseUrl: process.env.KINTONE_API_BASE_URL,
    auth: {
      apiToken: process.env.KINTONE_TEST_APP_TOKEN,
    },
  });
  const client = new KintoneClientImpl(underlying);
  const autoCommitInterpreter = new AutoCommitInterpreterImpl(client);
  const transactionalCommitInterpreter = new TransactionalCommitInterpreterImpl(client);

  beforeEach(async () => {
    // Truncate app
    const records = await underlying.record.getAllRecords({ app: APP_ID });
    await underlying.record.deleteAllRecords({
      app: APP_ID,
      records: records.map((record) => record.$id)
        .filter(($id): $id is ID => $id.type === '__ID__')
        .map(($id) => ({ id: $id.value })),
    });
  });

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
      .instance(autoCommitInterpreter, transactionalCommitInterpreter)
      .addRecord('record1')<RecordType>({ app: '2', record })
      .getRecordOpt('record2')<RecordType>({ app: '2', id: '1' })
      .getRecordOpt('record3')<RecordType>({ app: '2', id: '9999' })
      .getRecords('records')<RecordType>({ app: '2' })
      .deleteRecords({ app: '2', records: [{ id: '1' }] })
      .map('record1')(async () => 1)
      .commitTransactional(({ record1 }) => record1);
    console.log(result);
  });
});
