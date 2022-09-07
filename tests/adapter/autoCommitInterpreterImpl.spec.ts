import * as T from 'fp-ts/Task';
import * as TO from 'fp-ts/TaskOption';
import * as O from 'fp-ts/Option';
import {
  anything, capture, instance, mock, when,
} from 'ts-mockito';
import { AutoCommitInterpreterImpl } from '../../src/adapter/autoCommitInterpreterImpl';
import {
  addRecord, async, deleteRecords, getRecordOpt, getRecords, updateRecordById,
} from '../../src/kioa';
import { Record } from '../../src/core';
import { KintoneClient } from '../../src/client/kintoneClient';

describe('AutoCommitInterpreterImpl', () => {
  type TestRecord = Record & {
    field1: { value: string }
  };

  describe('translate', () => {
    it('should translate Async to Task', async () => {
      // Given
      const client = mock<KintoneClient>();
      const interpreter = new AutoCommitInterpreterImpl(instance(client));
      // When
      const kio = async({ a: async () => 1 });
      const result = interpreter.translate(kio)();
      // Then
      await expect(result).resolves.toEqual(1);
    });
    it('should translate GetRecordOpt to Task', async () => {
      // Given
      const record: TestRecord = {
        field1: { value: 'test' },
      };
      const client = mock<KintoneClient>();
      when(client.getRecordOpt(anything())).thenReturn(TO.some(record));
      const interpreter = new AutoCommitInterpreterImpl(instance(client));
      // When
      const kio = getRecordOpt({ app: '1', id: '1' });
      const result = interpreter.translate(kio)();
      // Then
      await expect(result).resolves.toEqual(O.some(record));
    });
    it('should translate GetRecords to Task', async () => {
      // Given
      const expected = [
        { id: { value: '1' }, field1: { value: 'test1' } },
        { id: { value: '2' }, field1: { value: 'test2' } },
        { id: { value: '3' }, field1: { value: 'test3' } },
      ];
      const client = mock<KintoneClient>();
      when(client.getRecords(anything()))
        .thenReturn(T.of({ records: expected, totalCount: O.some(3) }));
      const interpreter = new AutoCommitInterpreterImpl(instance(client));
      // When
      const kio = getRecords({ app: '1' });
      const actual = interpreter.translate(kio)();
      // Then
      await expect(actual).resolves.toEqual(expected);
    });
    it('should translate AddRecord to Task', async () => {
      // Given
      const record: TestRecord = {
        field1: { value: 'test' },
      };
      const client = mock<KintoneClient>();
      when(client.addRecord(anything())).thenReturn(T.of({ id: '1', revision: '1' }));
      const interpreter = new AutoCommitInterpreterImpl(instance(client));
      // When
      const kio = addRecord({ app: '1', record });
      const result = interpreter.translate(kio)();
      // Then
      await expect(result).resolves.toEqual(O.some({ id: '1', revision: '1' }));
    });
    it('should translate UpdateRecord to Task', async () => {
      // Given
      const record: TestRecord = {
        id: { value: '1' },
        field1: { value: 'test' },
      };
      const client = mock<KintoneClient>();
      when(client.updateRecord(anything())).thenReturn(T.of({ revision: '1' }));
      const interpreter = new AutoCommitInterpreterImpl(instance(client));
      // When
      const kio = updateRecordById({ app: '1', id: '1', record });
      const result = interpreter.translate(kio)();
      // Then
      await expect(result).resolves.toEqual(O.some({ revision: '1' }));
    });
    it('should translate DeleteRecords to Task', async () => {
      // Given
      const client = mock<KintoneClient>();
      when(client.deleteRecords(anything())).thenReturn(T.of(undefined));
      const interpreter = new AutoCommitInterpreterImpl(instance(client));
      // When
      const kio = deleteRecords({ app: '1', records: [{ id: '1', revision: '1' }] });
      await interpreter.translate(kio)();
      // Then
      const [args] = capture(client.deleteRecords).last();
      expect(args.app).toBe('1');
      expect(args.records).toEqual([{ id: '1', revision: '1' }]);
    });
  });
});
