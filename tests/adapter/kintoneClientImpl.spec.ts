import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import * as O from 'fp-ts/Option';
import { KintoneClientImpl } from '../../src/adapter/kintoneClientImpl';
import { Record } from '../../src/core';
import { KintoneClient } from '../../src/client/kintoneClient';

jest.setTimeout(60000);
describe('KintoneClientImpl', () => {
  const APP_ID = process.env.KINTONE_TEST_APP_ID ?? '';
  type TestRecord = Record & {
    id: { value: string }
    field1: { value: string }
  };

  const underlying = new KintoneRestAPIClient({
    baseUrl: process.env.KINTONE_API_BASE_URL,
    auth: {
      apiToken: process.env.KINTONE_TEST_APP_TOKEN,
    },
  });
  const client: KintoneClient = new KintoneClientImpl(underlying);

  beforeEach(async () => {
    // Truncate app
    const records = await underlying.record.getAllRecords({ app: APP_ID });
    await underlying.record.deleteAllRecords({
      app: APP_ID,
      records: (records as TestRecord[]).map((record) => ({ id: record.$id!.value })),
    });
  });

  describe('getRecordOpt', () => {
    it('should return a record found for id', async () => {
      // Given
      const expected: TestRecord = {
        id: { value: '1' },
        field1: { value: 'test' },
      };
      const { id } = await underlying.record.addRecord({ app: APP_ID, record: expected });
      // When
      const recordOpt = await client.getRecordOpt<TestRecord>({ app: APP_ID, id })();
      // Then
      const actual = O.getOrElseW(() => {
        throw Error();
      })(recordOpt);
      expect(actual.field1.value).toBe(expected.field1.value);
    });
    it('should return none when no record found for id', async () => {
      // When
      const recordOpt = await client.getRecordOpt({ app: '2', id: '9999' })();
      // Then
      expect(recordOpt).toBe(O.none);
    });
    it('should throw error when unexpected error occurred', async () => {
      // When
      const result = client.getRecordOpt({ app: '9999', id: '1' })();
      // Then
      await expect(result).rejects.toThrowError();
    });
  });

  describe('getRecords', () => {
    it('should return records with selected fields only', async () => {
      // Given
      const expected: TestRecord = {
        id: { value: '1' },
        field1: { value: 'a' },
      };
      await underlying.record.addRecord({ app: APP_ID, record: expected });
      // When
      const { records } = await client.getRecords<TestRecord>({
        app: APP_ID,
        fields: ['field1'],
      })();
      const [actual] = records;
      // Then
      expect(Object.keys(actual)).toEqual(['field1']);
      expect(actual.field1?.value).toBe(expected.field1.value);
    });
    it('should return records with all fields', async () => {
      // Given
      const expected: TestRecord = {
        id: { value: '1' },
        field1: { value: 'a' },
      };
      await underlying.record.addRecord({ app: APP_ID, record: expected });
      // When
      const { records } = await client.getRecords<TestRecord>({
        app: APP_ID,
      })();
      const [actual] = records;
      // Then
      expect(actual).toHaveProperty('$id');
      expect(actual).toHaveProperty('$revision');
      expect(actual).toHaveProperty('id');
      expect(actual).toHaveProperty('field1');
    });
    it('should return records filtered by query', async () => {
      // Given
      const record1: TestRecord = {
        id: { value: '1' },
        field1: { value: 'a' },
      };
      const record2: TestRecord = {
        id: { value: '2' },
        field1: { value: 'b' },
      };
      const record3: TestRecord = {
        id: { value: '3' },
        field1: { value: 'c' },
      };
      await underlying.record.addRecord({ app: APP_ID, record: record1 });
      await underlying.record.addRecord({ app: APP_ID, record: record2 });
      await underlying.record.addRecord({ app: APP_ID, record: record3 });
      // When
      const { records } = await client.getRecords<TestRecord>({
        app: APP_ID,
        query: 'id=2',
      })();
      // Then
      expect(records.map((record) => record.id.value)).toEqual([record2.id.value]);
    });
    it('should return total count', async () => {
      // Given
      const record1: TestRecord = {
        id: { value: '1' },
        field1: { value: 'a' },
      };
      const record2: TestRecord = {
        id: { value: '2' },
        field1: { value: 'b' },
      };
      const record3: TestRecord = {
        id: { value: '3' },
        field1: { value: 'c' },
      };
      await underlying.record.addRecord({ app: APP_ID, record: record1 });
      await underlying.record.addRecord({ app: APP_ID, record: record2 });
      await underlying.record.addRecord({ app: APP_ID, record: record3 });
      // When
      const { totalCount } = await client.getRecords<TestRecord>({
        app: APP_ID,
        totalCount: true,
      })();
      // Then
      expect(totalCount).toEqual(O.some(3));
    });
  });

  describe('addRecord', () => {
    it('should add new record', async () => {
      // Given
      const expected: TestRecord = {
        id: { value: '1' },
        field1: { value: 'test' },
      };
      // When
      const { id } = await client.addRecord({ app: APP_ID, record: expected })();
      // Then
      const { record } = await underlying.record.getRecord({ app: APP_ID, id });
      expect(record.field1.value).toBe(expected.field1.value);
    });
  });

  describe('updateRecord', () => {
    it('should update record for id', async () => {
      // Given
      const record: TestRecord = {
        id: { value: '1' },
        field1: { value: 'test' },
      };
      const { id } = await underlying.record.addRecord({ app: APP_ID, record });
      // When
      const expected: TestRecord = {
        id: { value: '1' },
        field1: { value: 'updated' },
      };
      await client.updateRecord({ app: APP_ID, id, record: expected })();
      // Then
      const { record: actual } = await underlying.record.getRecord({ app: APP_ID, id });
      expect(actual.field1.value).toBe(expected.field1.value);
    });
    it('should update record for update key', async () => {
      // Given
      const record: TestRecord = {
        id: { value: '1' },
        field1: { value: 'test' },
      };
      const { id } = await underlying.record.addRecord({ app: APP_ID, record });
      // When
      const expected: TestRecord = {
        id: { value: '1' },
        field1: { value: 'updated' },
      };
      await client.updateRecord<TestRecord>({
        app: APP_ID,
        updateKey: { field: 'id', value: '1' },
        record: expected,
      })();
      // Then
      const { record: actual } = await underlying.record.getRecord({ app: APP_ID, id });
      expect(actual.field1.value).toBe(expected.field1.value);
    });
    it('should throw error when no record found for id', async () => {
      // Given
      const record: TestRecord = {
        id: { value: '9999' },
        field1: { value: 'test' },
      };
      // When
      const result = client.updateRecord({
        app: APP_ID,
        id: '9999',
        record,
      })();
      // Then
      await expect(result).rejects.toThrowError();
    });
    it('should throw error when no record found for update key', async () => {
      // Given
      const record: TestRecord = {
        id: { value: '9999' },
        field1: { value: 'test' },
      };
      // When
      const result = client.updateRecord<TestRecord>({
        app: APP_ID,
        updateKey: { field: 'id', value: '9999' },
        record,
      })();
      // Then
      await expect(result).rejects.toThrowError();
    });
    it('should throw error when revisions do not match', async () => {
      // Given
      const record: TestRecord = {
        id: { value: '1' },
        field1: { value: 'test' },
      };
      await underlying.record.addRecord({ app: APP_ID, record });
      // When
      const expected: TestRecord = {
        id: { value: '1' },
        field1: { value: 'updated' },
      };
      const result = client.updateRecord<TestRecord>({
        app: APP_ID,
        updateKey: { field: 'id', value: '1' },
        record: expected,
        revision: '9999',
      })();
      // Then
      await expect(result).rejects.toThrowError();
    });
  });

  describe('deleteRecords', () => {
    it('should delete records for ids', async () => {
      // Given
      const record: TestRecord = {
        id: { value: '1' },
        field1: { value: 'test' },
      };
      const { id } = await underlying.record.addRecord({ app: APP_ID, record });
      // When
      await client.deleteRecords({ app: APP_ID, records: [{ id }] })();
      // Then
      const none = await client.getRecordOpt({ app: APP_ID, id })();
      expect(none).toBe(O.none);
    });
    it('should delete records for ids and revisions', async () => {
      // Given
      const record: TestRecord = {
        id: { value: '1' },
        field1: { value: 'test' },
      };
      const { id, revision } = await underlying.record.addRecord({ app: APP_ID, record });
      // When
      await client.deleteRecords({ app: APP_ID, records: [{ id, revision }] })();
      // Then
      const none = await client.getRecordOpt({ app: APP_ID, id })();
      expect(none).toBe(O.none);
    });
    it('should throw error when no record found for id', async () => {
      // When
      const result = client.deleteRecords({ app: APP_ID, records: [{ id: '9999' }] })();
      // Then
      await expect(result).rejects.toThrowError();
    });
    it('should throw error when revisions do not match', async () => {
      // Given
      const record: TestRecord = {
        id: { value: '1' },
        field1: { value: 'test' },
      };
      const { id } = await underlying.record.addRecord({ app: APP_ID, record });
      // When
      const result = client.deleteRecords({ app: APP_ID, records: [{ id, revision: '9999' }] })();
      // Then
      await expect(result).rejects.toThrowError();
    });
  });
});
