import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import * as O from 'fp-ts/Option';
import { KintoneClientImpl } from '../../src/adapter/kintoneClientImpl';

describe('KintoneClientImpl', () => {
  const underlying = new KintoneRestAPIClient({
    baseUrl: process.env.KINTONE_API_BASE_URL,
    auth: {
      apiToken: process.env.KINTONE_TEST_APP_TOKEN,
    },
  });
  const client = new KintoneClientImpl(underlying);

  describe('getRecordOpt', () => {
    it('should return a record found for id', async () => {
      // When
      const recordOpt = await client.getRecordOpt({ app: '2', id: '1' })();
      // Then
      const record = O.getOrElseW(() => {
        throw Error();
      })(recordOpt);
      expect(record.$id.value).toBe('1');
    });
    it('should return none when no record found for id', async () => {
      // When
      const recordOpt = await client.getRecordOpt({ app: '2', id: '9999' })();
      // Then
      expect(recordOpt).toBe(O.none);
    });
  });
});
