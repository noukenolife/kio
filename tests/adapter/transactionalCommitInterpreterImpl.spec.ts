import * as T from 'fp-ts/Task';
import * as FR from 'fp-ts-contrib/Free';
import * as TO from 'fp-ts/TaskOption';
import * as O from 'fp-ts/Option';
import {
  anything, capture, instance, mock, when,
} from 'ts-mockito';
import { Do } from 'fp-ts-contrib/Do';
import * as TS from '../../src/taskState';
import {
  addRecord, async, deleteRecords, getRecordOpt, getRecords, updateRecordById,
} from '../../src/kioa';
import { Record } from '../../src/core';
import { KintoneClient } from '../../src/client/kintoneClient';
import { TransactionalCommitInterpreterImpl } from '../../src/adapter/transactionalCommitInterpreterImpl';
import { KintoneUoW } from '../../src/uow/kintoneUoW';

describe('TransactionalCommitInterpreterImpl', () => {
  type TestRecord = Record & {
    field1: { value: string }
  };

  describe('kioToTaskState', () => {
    const initUoW: KintoneUoW = {
      store: {},
      requests: [],
    };
    it('should translate Async to TaskState', async () => {
      // Given
      const client = mock<KintoneClient>();
      const interpreter = new TransactionalCommitInterpreterImpl(instance(client));
      // When
      const kio = async({ a: async () => 1 });
      const [result, state] = await FR.foldFree(
        TS.Monad,
      )(interpreter.kioToTaskState, kio)(initUoW)();
      // Then
      expect(result).toEqual(1);
      expect(state).toEqual(initUoW);
    });
    describe('should translate GetRecordOpt to TaskState', () => {
      it('when a record found', async () => {
        // Given
        const record: TestRecord = {
          $id: { type: '__ID__', value: '1' },
          field1: { value: 'test' },
        };
        const client = mock<KintoneClient>();
        when(client.getRecordOpt(anything())).thenReturn(TO.some(record));
        const interpreter = new TransactionalCommitInterpreterImpl(instance(client));
        // When
        const kio = getRecordOpt({ app: '1', id: '1' });
        const [result, state] = await FR.foldFree(
          TS.Monad,
        )(interpreter.kioToTaskState, kio)(initUoW)();
        // Then
        expect(result).toEqual(O.some(record));
        expect(state).toEqual({
          ...initUoW,
          store: { 1: { 1: record } },
        });
      });
      it('when no record found', async () => {
        // Given
        const client = mock<KintoneClient>();
        when(client.getRecordOpt(anything())).thenReturn(TO.none);
        const interpreter = new TransactionalCommitInterpreterImpl(instance(client));
        // When
        const kio = getRecordOpt({ app: '1', id: '1' });
        const [result, state] = await FR.foldFree(
          TS.Monad,
        )(interpreter.kioToTaskState, kio)(initUoW)();
        // Then
        expect(result).toEqual(O.none);
        expect(state).toEqual(initUoW);
      });
    });
    it('should translate GetRecords to TaskState', async () => {
      // Given
      const expected: TestRecord[] = [
        { $id: { type: '__ID__', value: '1' }, id: { value: '1' }, field1: { value: 'test1' } },
        { $id: { type: '__ID__', value: '2' }, id: { value: '2' }, field1: { value: 'test2' } },
        { $id: { type: '__ID__', value: '3' }, id: { value: '3' }, field1: { value: 'test3' } },
      ];
      const client = mock<KintoneClient>();
      when(client.getRecords(anything()))
        .thenReturn(T.of({ records: expected, totalCount: O.some(3) }));
      const interpreter = new TransactionalCommitInterpreterImpl(instance(client));
      // When
      const kio = getRecords({ app: '1' });
      const [result, state] = await FR.foldFree(
        TS.Monad,
      )(interpreter.kioToTaskState, kio)(initUoW)();
      // Then
      expect(result).toEqual(expected);
      expect(state).toEqual({
        ...initUoW,
        store: { 1: Object.fromEntries(expected.map((r) => [r.$id?.value, r])) },
      });
    });
    it('should translate AddRecord to TaskState', async () => {
      // Given
      const record: TestRecord = {
        field1: { value: 'test' },
      };
      const client = mock<KintoneClient>();
      const interpreter = new TransactionalCommitInterpreterImpl(instance(client));
      // When
      const kio = addRecord({ app: '1', record });
      const [result, state] = await FR.foldFree(
        TS.Monad,
      )(interpreter.kioToTaskState, kio)(initUoW)();
      // Then
      expect(result).toEqual(O.none);
      expect(state).toEqual({
        ...initUoW,
        requests: [{
          method: 'POST',
          api: '/k/v1/record.json',
          payload: {
            app: '1',
            record,
          },
        }],
      });
    });
    it('should translate UpdateRecord to TaskState', async () => {
      // Given
      const record: TestRecord = {
        $id: { type: '__ID__', value: '1' },
        $revision: { type: '__REVISION__', value: '1' },
        id: { value: '1' },
        field1: { value: 'test' },
      };
      const updatedRecord: TestRecord = {
        ...record,
        field1: { value: 'updated' },
      };
      const client = mock<KintoneClient>();
      when(client.getRecordOpt(anything())).thenReturn(TO.some(record));
      const interpreter = new TransactionalCommitInterpreterImpl(instance(client));
      // When
      const kio = Do(FR.free)
        .bind('get', getRecordOpt({ app: '1', id: '1' }))
        .bind('result', updateRecordById({ app: '1', id: '1', record: updatedRecord }))
        .return(({ result }) => result);
      const [result, state] = await FR.foldFree(
        TS.Monad,
      )(interpreter.kioToTaskState, kio)(initUoW)();
      // Then
      expect(result).toEqual(O.none);
      expect(state).toEqual({
        store: { 1: { 1: updatedRecord } },
        requests: [{
          method: 'PUT',
          api: '/k/v1/record.json',
          payload: {
            app: '1',
            record: updatedRecord,
            id: '1',
            revision: '1',
          },
        }],
      });
    });
    it('should translate DeleteRecords to TaskState', async () => {
      // Given
      const record1: TestRecord = {
        $id: { type: '__ID__', value: '1' },
        $revision: { type: '__REVISION__', value: '1' },
        id: { value: '1' },
        field1: { value: 'test1' },
      };
      const record2: TestRecord = {
        $id: { type: '__ID__', value: '2' },
        $revision: { type: '__REVISION__', value: '2' },
        id: { value: '2' },
        field1: { value: 'test2' },
      };
      const records = [record1, record2];
      const client = mock<KintoneClient>();
      when(client.getRecords(anything()))
        .thenReturn(T.of({ records, totalCount: O.none }));
      const interpreter = new TransactionalCommitInterpreterImpl(instance(client));
      // When
      const kio = Do(FR.free)
        .bind('get', getRecords({ app: '1' }))
        .bind('result', deleteRecords({ app: '1', records: records.map((r) => ({ id: r.$id?.value ?? '', revision: r.$revision?.value ?? '' })) }))
        .return(({ result }) => result);
      const [, state] = await FR.foldFree(
        TS.Monad,
      )(interpreter.kioToTaskState, kio)(initUoW)();
      // Then
      expect(state).toEqual({
        store: { 1: {} },
        requests: [{
          method: 'DELETE',
          api: '/k/v1/records.json',
          payload: {
            app: '1',
            ids: ['1', '2'],
            revisions: ['1', '2'],
          },
        }],
      });
    });
  });
  describe('translate', () => {
    it('should translate kio to Task', async () => {
      // Given
      const record1: TestRecord = {
        $id: { type: '__ID__', value: '1' },
        $revision: { type: '__REVISION__', value: '1' },
        id: { value: '1' },
        field1: { value: 'test1' },
      };
      const record2: TestRecord = {
        $id: { type: '__ID__', value: '2' },
        $revision: { type: '__REVISION__', value: '2' },
        id: { value: '2' },
        field1: { value: 'test2' },
      };
      const client = mock<KintoneClient>();
      when(client.getRecordOpt(anything()))
        .thenReturn(TO.some(record1))
        .thenReturn(TO.some(record2));
      when(client.bulkRequest(anything())).thenReturn(T.of(undefined));
      const interpreter = new TransactionalCommitInterpreterImpl(instance(client));
      // When
      const updatedRecord: TestRecord = {
        ...record1,
        field1: { value: 'updated' },
      };
      const kio = Do(FR.free)
        .bind('get1', getRecordOpt({ app: '1', id: '1' }))
        .bind('get2', getRecordOpt({ app: '1', id: '2' }))
        .bind('update', updateRecordById({ app: '1', id: '1', record: updatedRecord }))
        .bind('delete', deleteRecords({ app: '1', records: [{ id: '1' }, { id: '2' }] }))
        .return(() => {});
      await interpreter.translate(kio)();
      // Then
      const [bulkRequestArg] = capture(client.bulkRequest).last();
      expect(bulkRequestArg.requests).toEqual([
        {
          method: 'PUT',
          api: '/k/v1/record.json',
          payload: {
            app: '1',
            record: updatedRecord,
            id: '1',
            revision: '1',
          },
        },
        {
          method: 'DELETE',
          api: '/k/v1/records.json',
          payload: {
            app: '1',
            ids: ['1', '2'],
            revisions: ['1', '2'],
          },
        },
      ]);
    });
  });
});
