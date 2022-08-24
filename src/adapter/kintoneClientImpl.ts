import * as TO from 'fp-ts/TaskOption';
import * as T from 'fp-ts/Task';
import { KintoneRestAPIClient, KintoneRestAPIError } from '@kintone/rest-api-client';
import { none, some } from 'fp-ts/Option';
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
        return some(record);
      } catch (e) {
        const isNotFound = e instanceof KintoneRestAPIError && e.code === ERR_CODE_RECORD_NOT_FOUND;
        if (isNotFound) {
          return none;
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
}
