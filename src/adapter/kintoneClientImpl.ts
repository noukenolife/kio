import * as TO from 'fp-ts/TaskOption';
import * as O from 'fp-ts/Option';
import * as T from 'fp-ts/Task';
import { KintoneRestAPIClient, KintoneRestAPIError } from '@kintone/rest-api-client';
import {
  AppID, ID, Record, Revision,
} from '../core';
import { KintoneClient } from '../client/kintoneClient';
import { ERR_CODE_RECORD_NOT_FOUND } from '../client/kintoneClientError';

export class KintoneClientImpl implements KintoneClient {
  private client: KintoneRestAPIClient;

  constructor(client: KintoneRestAPIClient) {
    this.client = client;
  }

  getRecordOpt<R extends Record>(args: { app: AppID; id: ID }): TO.TaskOption<R> {
    return async () => {
      try {
        const { record } = await this.client.record.getRecord<R>(args);
        return O.some(record);
      } catch (e) {
        const isNotFound = e instanceof KintoneRestAPIError && e.code === ERR_CODE_RECORD_NOT_FOUND;
        if (isNotFound) {
          return O.none;
        }
        throw e;
      }
    };
  }

  addRecord<R extends Record>(
    args: { app: AppID; record: R },
  ): T.Task<{ id: ID; revision: Revision }> {
    return () => this.client.record.addRecord(args);
  }

  updateRecord<R extends Record>(args: {
    app: AppID
    record: R
    id?: ID
    updateKey?: {
      field: keyof R
      value: ID
    }
    revision?: Revision
  }): T.Task<{ revision: Revision }> {
    const keyArgs = () => {
      if (args.id) {
        return { id: args.id };
      }
      if (args.updateKey) {
        return {
          updateKey: { field: args.updateKey.field.toString(), value: args.updateKey.value },
        };
      }
      throw Error('Invalid argument');
    };
    return () => this.client.record.updateRecord({
      app: args.app,
      record: args.updateKey ? { ...args.record, [args.updateKey.field]: undefined } : args.record,
      revision: args.revision,
      ...keyArgs(),
    });
  }

  getRecords<R extends Record>(args: {
    app: AppID;
    query?: string | undefined;
    totalCount?: boolean | undefined;
  }): T.Task<{ records: R[]; totalCount: O.Option<number>; }>;
  getRecords<R extends Record>(args: {
    app: AppID;
    fields: [];
    query?: string | undefined;
    totalCount?: boolean | undefined;
  }): T.Task<{ records: R[]; totalCount: O.Option<number>; }>;
  getRecords<R extends Record>(args: {
    app: AppID;
    fields: [keyof R, ...(keyof R)[]];
    query?: string | undefined;
    totalCount?: boolean | undefined;
  }): T.Task<{ records: Partial<R>[]; totalCount: O.Option<number>; }>;
  getRecords<R extends Record>(args: {
    app: AppID;
    fields?: (keyof R)[];
    query?: string | undefined;
    totalCount?: boolean | undefined;
  }): T.Task<{ records: (R | Partial<R>)[]; totalCount: O.Option<number>; }> {
    const modifiedArgs = {
      ...args,
      fields: args.fields?.map((field) => field.toString()),
    };
    return () => this.client.record.getRecords<R>(modifiedArgs)
      .then(({ records, totalCount }) => ({
        records,
        totalCount: O.map((count) => Number(count))(O.fromNullable(totalCount)),
      }));
  }

  deleteRecords(args: {
    app: AppID;
    records: { id: ID; revision?: Revision }[];
  }): T.Task<void> {
    return () => this.client.record.deleteAllRecords(args).then(() => {});
  }
}
