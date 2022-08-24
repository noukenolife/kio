import * as FR from 'fp-ts-contrib/Free';
import * as T from 'fp-ts/Task';
import * as TO from 'fp-ts/TaskOption';
import * as O from 'fp-ts/Option';
import {
  anything, instance, mock, when,
} from 'ts-mockito';
import { AutoCommitInterpreterImpl } from '../../src/adapter/autoCommitInterpreterImpl';
import { addRecord, getRecordOpt } from '../../src/kioa';
import { Record } from '../../src/core';
import { KintoneClient } from '../../src/client/kintoneClient';

describe('AutoCommitInterpreterImpl', () => {
  type TestRecord = Record & {
    field1: { value: string }
  };

  describe('translate', () => {
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
      const result = FR.foldFree(T.Monad)(interpreter.translate, kio)();
      // Then
      await expect(result).resolves.toEqual(O.some(record));
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
      const result = FR.foldFree(T.Monad)(interpreter.translate, kio)();
      // Then
      await expect(result).resolves.toEqual(O.some({ id: '1', revision: '1' }));
    });
  });
});
