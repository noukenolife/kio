import {
  AppID, ID, Record, Revision,
} from '../core';

export type KintoneWriteRequest<R extends Record = Record> = {
  method: 'POST',
  api: '/k/v1/record.json',
  payload: {
    app: AppID,
    record: R
  }
} | {
  method: 'PUT',
  api: '/k/v1/record.json',
  payload: {
    app: AppID,
    id?: ID,
    updateKey?: { field: keyof R, value: ID },
    record: R
    revision?: Revision
  }
} | {
  method: 'DELETE',
  api: '/k/v1/records.json',
  payload: {
    app: AppID,
    ids: ID[],
    revisions: Revision[]
  }
};
