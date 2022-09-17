import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { ID } from '@kintone/rest-api-client/lib/KintoneFields/types/field';
import { KIO } from '../src/kio';
import { KintoneClientImpl } from '../src/adapter/kintoneClientImpl';
import { AutoCommitInterpreterImpl } from '../src/adapter/autoCommitInterpreterImpl';
import { TransactionalCommitInterpreterImpl } from '../src/adapter/transactionalCommitInterpreterImpl';
import { sleep } from './utils';

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

  it('should reject transactional commit when somebody have already committed', async () => {
    // Given
    type RecordType = {
      id: { value: string },
      field1: { value: string },
    };
    const record1: RecordType = {
      id: { value: '1' },
      field1: { value: 'record1' },
    };
    const record2: RecordType = {
      id: { value: '2' },
      field1: { value: 'record2' },
    };
    const record3: RecordType = {
      id: { value: '3' },
      field1: { value: 'record3' },
    };
    await KIO
      .instance(autoCommitInterpreter, transactionalCommitInterpreter)
      .addRecord('record1')({ app: APP_ID, record: record1 })
      .addRecord('record2')({ app: APP_ID, record: record2 })
      .addRecord('record3')({ app: APP_ID, record: record3 })
      .commit(() => {});
    // When
    const t1 = KIO
      .instance(autoCommitInterpreter, transactionalCommitInterpreter)
      .getRecords('records')<RecordType>({ app: APP_ID })
      .run('sleep')(() => sleep(1000))
      .updateRecordByUpdateKey('updateRecord3')<RecordType>({ app: APP_ID, updateKey: { field: 'id', value: '3' }, record: { ...record3, field1: { value: 'updatedByT1' } } })
      .commitTransactional(() => {});
    const t2 = KIO
      .instance(autoCommitInterpreter, transactionalCommitInterpreter)
      .getRecords('records')<RecordType>({ app: APP_ID })
      .updateRecordByUpdateKey('updateRecord3')<RecordType>({ app: APP_ID, updateKey: { field: 'id', value: '3' }, record: { ...record3, field1: { value: 'updatedByT2' } } })
      .commitTransactional(() => {});
    // Then
    const [t1Result, t2Result] = await Promise.allSettled([t1, t2]);
    expect(t1Result.status).toBe('rejected');
    expect(t2Result.status).toBe('fulfilled');
  });
});
