import * as TO from 'fp-ts/TaskOption';
import * as O from 'fp-ts/Option';
import * as T from 'fp-ts/Task';
import {
  AppID, ID, Record, Revision,
} from '../core';
import { KintoneWriteRequest } from './kintoneRequest';

export type KintoneClient = {
  getRecordOpt: <R extends Record>(args: {
    app: AppID,
    id: ID
  }) => TO.TaskOption<R>
  getRecords<R extends Record>(args: {
    app: AppID;
    query?: string;
    totalCount?: boolean
  }): T.Task<{
    records: R[],
    totalCount: O.Option<number>
  }>
  getRecords<R extends Record>(args: {
    app: AppID;
    fields: [];
    query?: string;
    totalCount?: boolean
  }): T.Task<{
    records: R[],
    totalCount: O.Option<number>
  }>
  getRecords<R extends Record>(args: {
    app: AppID;
    fields: [keyof R, ...(keyof R)[]];
    query?: string;
    totalCount?: boolean
  }): T.Task<{
    records: Partial<R>[],
    totalCount: O.Option<number>
  }>
  addRecord: <R extends Record>(args: {
    app: AppID,
    record: R
  }) => T.Task<{ id: ID, revision: Revision }>
  updateRecord: <R extends Record>(args: {
    app: AppID
    record: R
    id?: ID
    updateKey?: {
      field: keyof R
      value: ID
    }
    revision?: Revision
  }) => T.Task<{ revision: Revision }>
  deleteRecords: (args: {
    app: AppID
    records: { id: ID, revision?: Revision }[]
  }) => T.Task<void>
  bulkRequest: (args: {
    requests: KintoneWriteRequest[]
  }) => T.Task<void>
};
