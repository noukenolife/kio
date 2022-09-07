import {
  KintoneUoW,
  pushAddRecordRequest,
  pushDeleteRecordsRequest,
  pushRecord,
  pushRecords,
  pushUpdateRecordRequest,
} from '../../src/uow/kintoneUoW';
import { Record } from '../../src/core';

describe('KintoneUoW', () => {
  type TestRecord = Record & {
    id: { value: string },
    field1: { value: string }
  };
  describe('pushRecord', () => {
    it('should add new record in new app', () => {
      // Given
      const initUoW: KintoneUoW = {
        store: {},
        requests: [],
      };
      // When
      const record: TestRecord = {
        $id: { type: '__ID__', value: '1' },
        id: { value: '1' },
        field1: { value: 'test' },
      };
      const [,state] = pushRecord<Record>('1', record)(initUoW);
      // Then
      expect(state).toEqual({
        ...initUoW,
        store: { 1: { 1: record } },
      });
    });
    it('should add new record in existing app', () => {
      // Given
      const initUoW: KintoneUoW = {
        store: { 1: {} },
        requests: [],
      };
      // When
      const record: TestRecord = {
        $id: { type: '__ID__', value: '1' },
        id: { value: '1' },
        field1: { value: 'test' },
      };
      const [,state] = pushRecord<Record>('1', record)(initUoW);
      // Then
      expect(state).toEqual({
        ...initUoW,
        store: { 1: { 1: record } },
      });
    });
    it('should update existing record in existing app', () => {
      // Given
      const record: TestRecord = {
        $id: { type: '__ID__', value: '1' },
        id: { value: '1' },
        field1: { value: 'test' },
      };
      const initUoW: KintoneUoW = {
        store: { 1: { 1: record } },
        requests: [],
      };
      // When
      const updatedRecord: TestRecord = {
        $id: { type: '__ID__', value: '1' },
        id: { value: '1' },
        field1: { value: 'updated' },
      };
      const [,state] = pushRecord<Record>('1', updatedRecord)(initUoW);
      // Then
      expect(state).toEqual({
        ...initUoW,
        store: { 1: { 1: updatedRecord } },
      });
    });
    it('should throw error when no id in record', () => {
      // Given
      const initUoW: KintoneUoW = {
        store: {},
        requests: [],
      };
      // When
      const record: TestRecord = {
        id: { value: '1' },
        field1: { value: 'updated' },
      };
      const fn = () => pushRecord<Record>('1', record)(initUoW);
      // Then
      expect(fn).toThrowError();
    });
  });
  describe('pushRecords', () => {
    it('should add records', () => {
      // Given
      const initUoW: KintoneUoW = {
        store: {},
        requests: [],
      };
      // When
      const record1: TestRecord = { $id: { type: '__ID__', value: '1' }, id: { value: '1' }, field1: { value: 'value1' } };
      const record2: TestRecord = { $id: { type: '__ID__', value: '2' }, id: { value: '2' }, field1: { value: 'value2' } };
      const record3: TestRecord = { $id: { type: '__ID__', value: '3' }, id: { value: '3' }, field1: { value: 'value3' } };
      const records = [record1, record2, record3];
      const [,state] = pushRecords<Record>('1', records)(initUoW);
      // Then
      expect(state).toEqual({
        ...initUoW,
        store: {
          1: {
            1: record1,
            2: record2,
            3: record3,
          },
        },
      });
    });
    it('should throw error when no id in some of records', () => {
      // Given
      const initUoW: KintoneUoW = {
        store: {},
        requests: [],
      };
      // When
      const record1: TestRecord = { $id: { type: '__ID__', value: '1' }, id: { value: '1' }, field1: { value: 'value1' } };
      const record2: TestRecord = { $id: { type: '__ID__', value: '2' }, id: { value: '2' }, field1: { value: 'value2' } };
      const record3: TestRecord = { id: { value: '3' }, field1: { value: 'value3' } };
      const records = [record1, record2, record3];
      const fn = () => pushRecords<Record>('1', records)(initUoW);
      // Then
      expect(fn).toThrowError();
    });
  });
  describe('pushAddRecordRequest', () => {
    it('should push add record request', () => {
      // Given
      const initUoW: KintoneUoW = {
        store: {},
        requests: [],
      };
      // When
      const record: TestRecord = {
        $id: { type: '__ID__', value: '1' },
        id: { value: '1' },
        field1: { value: 'test' },
      };
      const [,state] = pushAddRecordRequest<Record>('1', record)(initUoW);
      // Then
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
  });
  describe('pushUpdateRecordRequest', () => {
    it('should push update record request for id', () => {
      // Given
      const record: TestRecord = {
        $id: { type: '__ID__', value: '1' },
        $revision: { type: '__REVISION__', value: '1' },
        id: { value: '1' },
        field1: { value: 'test' },
      };
      const initUoW: KintoneUoW = {
        store: { 1: { 1: record } },
        requests: [],
      };
      // When
      const updatedRecord: TestRecord = { ...record, field1: { value: 'updated' } };
      const [,state] = pushUpdateRecordRequest<Record>('1', updatedRecord, '1')(initUoW);
      // Then
      expect(state).toEqual({
        store: { 1: { 1: updatedRecord } },
        requests: [{
          method: 'PUT',
          api: '/k/v1/record.json',
          payload: {
            app: '1',
            record: updatedRecord,
            id: '1',
            updateKey: undefined,
            revision: '1',
          },
        }],
      });
    });
    it('should push update record request for update key', () => {
      // Given
      const record: TestRecord = {
        $id: { type: '__ID__', value: '1' },
        $revision: { type: '__REVISION__', value: '1' },
        id: { value: '1' },
        field1: { value: 'test' },
      };
      const initUoW: KintoneUoW = {
        store: { 1: { 1: record } },
        requests: [],
      };
      // When
      const updatedRecord: TestRecord = { ...record, field1: { value: 'updated' } };
      const [,state] = pushUpdateRecordRequest<Record>(
        '1',
        updatedRecord,
        undefined,
        { field: 'id', value: '1' },
      )(initUoW);
      // Then
      expect(state).toEqual({
        store: { 1: { 1: updatedRecord } },
        requests: [{
          method: 'PUT',
          api: '/k/v1/record.json',
          payload: {
            app: '1',
            record: updatedRecord,
            id: undefined,
            updateKey: { field: 'id', value: '1' },
            revision: '1',
          },
        }],
      });
    });
    it('should throw error when neither id nor update key is specified', () => {
      // Given
      const initUoW: KintoneUoW = {
        store: {},
        requests: [],
      };
      const record: TestRecord = {
        $id: { type: '__ID__', value: '1' },
        $revision: { type: '__REVISION__', value: '1' },
        id: { value: '1' },
        field1: { value: 'test' },
      };
      // When
      const fn = () => pushUpdateRecordRequest<Record>(
        '1',
        record,
        undefined,
        undefined,
      )(initUoW);
      // Then
      expect(fn).toThrowError();
    });
    it('should throw error when record not found in store for id', () => {
      // Given
      const record: TestRecord = {
        $id: { type: '__ID__', value: '1' },
        $revision: { type: '__REVISION__', value: '1' },
        id: { value: '1' },
        field1: { value: 'test' },
      };
      const initUoW: KintoneUoW = {
        store: { 1: { 1: record } },
        requests: [],
      };
      // When
      const updatedRecord: TestRecord = {
        $id: { type: '__ID__', value: '2' },
        $revision: { type: '__REVISION__', value: '1' },
        id: { value: '2' },
        field1: { value: 'updated' },
      };
      const fn = () => pushUpdateRecordRequest<Record>(
        '1',
        updatedRecord,
        '2',
        undefined,
      )(initUoW);
      // Then
      expect(fn).toThrowError();
    });
    it('should throw error when record not found in store for update key', () => {
      // Given
      const record: TestRecord = {
        $id: { type: '__ID__', value: '1' },
        $revision: { type: '__REVISION__', value: '1' },
        id: { value: '1' },
        field1: { value: 'test' },
      };
      const initUoW: KintoneUoW = {
        store: { 1: { 1: record } },
        requests: [],
      };
      // When
      const updatedRecord: TestRecord = {
        $id: { type: '__ID__', value: '2' },
        $revision: { type: '__REVISION__', value: '1' },
        id: { value: '2' },
        field1: { value: 'updated' },
      };
      const fn = () => pushUpdateRecordRequest<Record>(
        '1',
        updatedRecord,
        undefined,
        { field: 'id', value: '2' },
      )(initUoW);
      // Then
      expect(fn).toThrowError();
    });
    it('should throw error when no revision in record in store', () => {
      // Given
      const record: TestRecord = {
        $id: { type: '__ID__', value: '1' },
        id: { value: '1' },
        field1: { value: 'test' },
      };
      const initUoW: KintoneUoW = {
        store: { 1: { 1: record } },
        requests: [],
      };
      // When
      const updatedRecord: TestRecord = {
        $id: { type: '__ID__', value: '1' },
        $revision: { type: '__REVISION__', value: '1' },
        id: { value: '1' },
        field1: { value: 'updated' },
      };
      const fn = () => pushUpdateRecordRequest<Record>(
        '1',
        updatedRecord,
        '1',
        undefined,
      )(initUoW);
      // Then
      expect(fn).toThrowError();
    });
  });
  describe('pushDeleteRecordsRequest', () => {
    const record1: TestRecord = {
      $id: { type: '__ID__', value: '1' }, $revision: { type: '__REVISION__', value: '1' }, id: { value: '1' }, field1: { value: 'value1' },
    };
    const record2: TestRecord = {
      $id: { type: '__ID__', value: '2' }, $revision: { type: '__REVISION__', value: '2' }, id: { value: '2' }, field1: { value: 'value2' },
    };
    const record3: TestRecord = {
      $id: { type: '__ID__', value: '3' }, $revision: { type: '__REVISION__', value: '3' }, id: { value: '3' }, field1: { value: 'value3' },
    };
    it('should push delete records request', () => {
      // Given
      const initUoW: KintoneUoW = {
        store: { 1: { 1: record1, 2: record2, 3: record3 } },
        requests: [],
      };
      // When
      const [,state] = pushDeleteRecordsRequest('1', [
        { id: '1' },
        { id: '2' },
        { id: '3' },
      ])(initUoW);
      // Then
      expect(state).toEqual({
        store: { 1: {} },
        requests: [{
          method: 'DELETE',
          api: '/k/v1/records.json',
          payload: {
            app: '1',
            ids: ['1', '2', '3'],
            revisions: ['1', '2', '3'],
          },
        }],
      });
    });
    it('should throw error when records not found in store for some of ids', () => {
      // Given
      const initUoW: KintoneUoW = {
        store: { 1: { 1: record1 } },
        requests: [],
      };
      // When
      const fn = () => pushDeleteRecordsRequest('1', [
        { id: '1' },
        { id: '2' },
        { id: '3' },
      ])(initUoW);
      expect(fn).toThrowError();
    });
    it('should throw error when records for some of ids have no revisions', () => {
      // Given
      const noRevisionRecord1: TestRecord = {
        $id: { type: '__ID__', value: '2' }, id: { value: '2' }, field1: { value: 'value2' },
      };
      const noRevisionRecord2: TestRecord = {
        $id: { type: '__ID__', value: '3' }, id: { value: '3' }, field1: { value: 'value3' },
      };
      const initUoW: KintoneUoW = {
        store: { 1: { 1: record1, 2: noRevisionRecord1, 3: noRevisionRecord2 } },
        requests: [],
      };
      // When
      const fn = () => pushDeleteRecordsRequest('1', [
        { id: '1' },
        { id: '2' },
        { id: '3' },
      ])(initUoW);
      expect(fn).toThrowError();
    });
  });
});
