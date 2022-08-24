import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import * as O from 'fp-ts/Option';
import { KintoneClientImpl } from '../../src/adapter/kintoneClientImpl';
import { Record } from '../../src/core';

describe('KintoneClientImpl', () => {
  const APP_ID = process.env.KINTONE_TEST_APP_ID ?? '';
  type TestRecord = Record & {
    field1: { value: string }
  };

  const underlying = new KintoneRestAPIClient({
    baseUrl: process.env.KINTONE_API_BASE_URL,
    auth: {
      apiToken: process.env.KINTONE_TEST_APP_TOKEN,
    },
  });
  const client = new KintoneClientImpl(underlying);

  beforeEach(async () => {
    // Truncate app
    const records = await underlying.record.getAllRecords<Record>({ app: APP_ID });
    await underlying.record.deleteAllRecords({
      app: APP_ID,
      records: records.map((record) => ({ id: record.$id!.value })),
    });
  });

  describe('getRecordOpt', () => {
    it('should return a record found for id', async () => {
      // Given
      const expected: TestRecord = {
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
  describe('addRecord', () => {
    it('should add new record', async () => {
      // Given
      const expected: TestRecord = {
        field1: { value: 'test' },
      };
      // When
      const { id } = await client.addRecord({ app: APP_ID, record: expected })();
      // Then
      const { record } = await underlying.record.getRecord<TestRecord>({ app: APP_ID, id });
      expect(record.field1.value).toBe(expected.field1.value);
    });
  });
});
