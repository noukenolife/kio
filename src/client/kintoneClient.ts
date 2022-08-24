import * as TO from 'fp-ts/TaskOption';
import * as T from 'fp-ts/Task';
import {
  AppID, ID, Record, Revision,
} from '../core';

export type KintoneClient = {
  getRecordOpt: <R extends Record>(args: {
    app: AppID,
    id: ID
  }) => TO.TaskOption<R>
  addRecord: <R extends Record>(args: {
    app: AppID,
    record: R
  }) => T.Task<{ id: ID, revision: Revision }>
};
