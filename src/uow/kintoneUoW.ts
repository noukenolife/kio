import * as S from 'fp-ts/State';
import * as E from 'fp-ts/Either';
import * as ARR from 'fp-ts/Array';
import { pipe } from 'fp-ts/function';
import {
  AppID, ID, Record, Revision,
} from '../core';
import { KintoneWriteRequest } from '../client/kintoneRequest';

export type KintoneUoW<R extends Record = Record> = {
  store: { [appId: AppID]: { [id: ID]: R } }
  requests: KintoneWriteRequest<R>[]
};

export const pushRecord = <R extends Record>(
  appId: AppID,
  record: R,
): S.State<KintoneUoW<R>, void> => {
  const id = record.$id?.value;
  if (!id) throw Error('No id in record.');

  return S.modify((s) => {
    const records = s.store[appId] ?? {};
    const newRecords = { ...records, [id]: record };
    const store = { ...s.store, [appId]: newRecords };
    return { ...s, store };
  });
};

export const pushRecords = <R extends Record>(
  appId: AppID,
  records: R[],
): S.State<KintoneUoW<R>, void> => S.map(() => undefined)(
    S.sequenceArray(records.map((record) => pushRecord(appId, record))),
  );

export const pushAddRecordRequest = <R extends Record>(
  appId: AppID,
  record: R,
): S.State<KintoneUoW<R>, void> => S.modify((s) => {
    const requests: KintoneWriteRequest<R>[] = [
      ...s.requests,
      {
        method: 'POST',
        api: '/k/v1/record.json',
        payload: {
          app: appId,
          record,
        },
      },
    ];
    return { ...s, requests };
  });

export const pushUpdateRecordRequest = <R extends Record>(
  appId: AppID,
  record: R,
  id?: ID,
  updateKey?: { field: keyof R, value: ID },
): S.State<KintoneUoW<R>, void> => S.modify((s) => {
    const records = s.store[appId] ?? {};
    const storedRecord = (() => {
      if (id) {
        return records[id];
      }
      if (updateKey) {
        return Object
          .values(records)
          .find((r) => r[updateKey.field].value === updateKey.value);
      }
      throw Error('Record id or update key should be specified');
    })();
    const storedRecordId = storedRecord?.$id?.value;
    const storedRecordRevision = storedRecord?.$revision?.value;
    if (!storedRecordId || !storedRecordRevision) throw Error('You must retrieve a record first to update it.');

    const store = { ...s.store, [appId]: { ...records, [storedRecordId]: record } };
    const requests: KintoneWriteRequest<R>[] = [
      ...s.requests,
      {
        method: 'PUT',
        api: '/k/v1/record.json',
        payload: {
          app: appId,
          record,
          id,
          updateKey,
          revision: storedRecordRevision,
        },
      },
    ];
    return { store, requests };
  });

export const pushDeleteRecordsRequest = <R extends Record>(
  appId: AppID,
  records: { id: ID }[],
): S.State<KintoneUoW<R>, void> => S.modify((s) => {
    const recordDictByAppId = s.store[appId] ?? {};
    const idRevisionPairs = records
      .map((r1) => pipe(
        E.fromNullable(r1.id)(
          Object.values(recordDictByAppId).find((r2) => r1.id === r2.$id?.value) ?? null,
        ),
        E.map<R, [ID?, Revision?]>((r) => [r.$id?.value, r.$revision?.value]),
        E.filterOrElse<[ID?, Revision?], [ID, Revision], ID>(
          (pair): pair is [ID, Revision] => !!pair[0] && !!pair[1],
          () => r1.id,
        ),
      ));

    const { left: notFoundIds, right: pairs } = ARR.separate(idRevisionPairs);
    if (notFoundIds.length > 0) throw Error(`Records with revisions not found for ids: ${notFoundIds.join(', ')}`);

    const [ids, revisions] = ARR.unzip(pairs);
    const requests: KintoneWriteRequest<R>[] = [
      ...s.requests, {
        method: 'DELETE',
        api: '/k/v1/records.json',
        payload: {
          app: appId,
          ids,
          revisions,
        },
      },
    ];
    const newRecordDictByAppId = ids.reduce((acc, id) => {
      const { [id]: value, ...recordDict } = acc;
      return recordDict;
    }, recordDictByAppId);
    return { store: { ...s.store, 1: newRecordDictByAppId }, requests };
  });
