import * as FR from 'fp-ts-contrib/Free';
import * as O from 'fp-ts/Option';
import { AppID, ID, Record } from './core';

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

export type KIOA<A> =
  | GetRecordOpt<A>;

declare module 'fp-ts/HKT' {
  interface URItoKind<A> {
    [URI]: KIOA<A>
  }
}

export const getRecordOpt = <R extends Record>(args: {
  app: AppID,
  id: ID,
}) => FR.liftF(new GetRecordOpt<O.Option<R>, R>({ ...args, f: (a) => a }));
