import { TaskOption } from 'fp-ts/TaskOption';
import { AppID, ID, Record } from '../core';

export type KintoneClient = {
  getRecordOpt: <R extends Record>(args: {
    app: AppID,
    id: ID
  }) => TaskOption<R>
};
