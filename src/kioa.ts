import * as FR from 'fp-ts-contrib/Free';
import * as O from 'fp-ts/Option';
import {
  AppID, ID, Record, Revision,
} from './core';

export const URI = 'KIOA';

export type URI = typeof URI;

export class GetRecordOpt<A, R extends Record = Record> {
  readonly _tag: 'GetRecordOpt' = 'GetRecordOpt';

  readonly _A!: A;

  readonly _URI!: URI;

  readonly app: AppID;

  readonly id: ID;

  readonly f: (a: O.Option<R>) => A;

  constructor(args: {
    app: AppID,
    id: ID,
    f: (a: O.Option<R>) => A
  }) {
    this.app = args.app;
    this.id = args.id;
    this.f = args.f;
  }
}

export class GetRecords<A, R extends Record = Record> {
  readonly _tag: 'GetRecords' = 'GetRecords';

  readonly _A!: A;

  readonly _URI!: URI;

  readonly app: AppID;

  readonly fields?: (keyof R)[];

  readonly query?: string;

  readonly f: (a: (R | Partial<R>)[]) => A;

  constructor(args: {
    app: AppID,
    fields?: (keyof R)[],
    query?: string,
    f: (a: (R | Partial<R>)[]) => A,
  }) {
    this.app = args.app;
    this.fields = args.fields;
    this.query = args.query;
    this.f = args.f;
  }
}

export class AddRecord<A, R extends Record = Record> {
  readonly _tag: 'AddRecord' = 'AddRecord';

  readonly _A!: A;

  readonly _URI!: URI;

  readonly app: AppID;

  readonly record: R;

  readonly f: (result: O.Option<{ id: ID, revision: Revision }>) => A;

  constructor(args: {
    app: AppID,
    record: R,
    f: (result: O.Option<{ id: ID, revision: Revision }>) => A
  }) {
    this.app = args.app;
    this.record = args.record;
    this.f = args.f;
  }
}

export class UpdateRecord<A, R extends Record = Record> {
  readonly _tag: 'UpdateRecord' = 'UpdateRecord';

  readonly _A!: A;

  readonly _URI!: URI;

  readonly app: AppID;

  readonly record: R;

  readonly id?: ID;

  readonly updateKey?: { field: keyof R, value: ID };

  readonly revision?: Revision;

  readonly f: (result: O.Option<{ revision: Revision }>) => A;

  constructor(args: {
    app: AppID,
    record: R,
    id?: ID,
    updateKey?: { field: keyof R, value: ID },
    revision?: Revision,
    f: (result: O.Option<{ revision: Revision }>) => A
  }) {
    this.app = args.app;
    this.record = args.record;
    this.id = args.id;
    this.updateKey = args.updateKey;
    this.revision = args.revision;
    this.f = args.f;
  }
}

export type KIOA<A> =
  | GetRecordOpt<A>
  | GetRecords<A>
  | AddRecord<A>
  | UpdateRecord<A>;

declare module 'fp-ts/HKT' {
  interface URItoKind<A> {
    [URI]: KIOA<A>
  }
}

export const getRecordOpt = <R extends Record>(args: {
  app: AppID,
  id: ID,
}) => FR.liftF(new GetRecordOpt<O.Option<R>, R>({ ...args, f: (a) => a }));

export function getRecords<R extends Record>(args: {
  app: AppID,
  query?: string,
  totalCount?: boolean,
}): FR.Free<URI, R[]>;
export function getRecords<R extends Record>(args: {
  app: AppID,
  fields: [],
  query?: string,
  totalCount?: boolean,
}): FR.Free<URI, R[]>;
export function getRecords<R extends Record>(args: {
  app: AppID,
  fields: [keyof R, ...(keyof R)[]],
  query?: string,
  totalCount?: boolean,
}): FR.Free<URI, Partial<R>[]>;
export function getRecords<R extends Record>(args: {
  app: AppID,
  fields?: (keyof R)[],
  query?: string,
  totalCount?: boolean,
}): FR.Free<URI, (R | Partial<R>)[]> {
  return FR.liftF(new GetRecords({
    ...args,
    f: (a) => a,
  }));
}

export const addRecord = <R extends Record>(args: {
  app: AppID,
  record: R,
}) => FR.liftF(
    new AddRecord<O.Option<{ id: ID, revision: Revision }>, R>({ ...args, f: (a) => a }),
  );

export const updateRecordById = <R extends Record>(args: {
  app: AppID,
  record: R,
  id: ID,
  revision?: Revision,
}) => FR.liftF(
    new UpdateRecord<O.Option<{ revision: Revision }>, R>({ ...args, f: (a) => a }),
  );

export const updateRecordByUpdateKey = <R extends Record>(args: {
  app: AppID,
  record: R,
  updateKey: { field: keyof R, value: ID },
  revision?: Revision,
}) => FR.liftF(
    new UpdateRecord<O.Option<{ revision: Revision }>, R>({ ...args, f: (a) => a }),
  );
