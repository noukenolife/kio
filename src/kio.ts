import * as FR from 'fp-ts-contrib/Free';
import * as O from 'fp-ts/Option';
import * as T from 'fp-ts/Task';
import { Do } from 'fp-ts-contrib/Do';
import {
  AppID, ID, Record, Revision,
} from './core';
import { AutoCommitInterpreter } from './interpreter/autoCommitInterpreter';
import * as K from './kioa';

export type KIOState<T extends string, A> = {
  [K in T]?: A
};

export class KIO<S extends {}> {
  private readonly kio: FR.Free<K.URI, S>;

  private readonly autoCommitInterpreter: AutoCommitInterpreter;

  private constructor(
    kio: FR.Free<K.URI, S>,
    autoCommitInterpreter: AutoCommitInterpreter,
  ) {
    this.kio = kio;
    this.autoCommitInterpreter = autoCommitInterpreter;
  }

  static instance(autoCommitInterpreter: AutoCommitInterpreter) {
    return new KIO(FR.of({}), autoCommitInterpreter);
  }

  getRecordOpt<R extends Record, T extends string = string>(args: {
    tag: T,
    app: AppID,
    id: ID,
  }): KIO<S & KIOState<T, R>> {
    const kio = Do(FR.free)
      .bind('state', this.kio)
      .bind('record', K.getRecordOpt<R>(args))
      .return(({ state, record }) => ({
        ...state,
        [args.tag]: O.toUndefined(record),
      }));
    return new KIO(kio, this.autoCommitInterpreter);
  }

  getRecords<R extends Record, T extends string = string>(args: {
    tag: T,
    app: AppID,
    query?: string,
  }): KIO<S & KIOState<T, R[]>>;
  getRecords<R extends Record, T extends string = string>(args: {
    tag: T,
    app: AppID,
    fields: [],
    query?: string,
  }): KIO<S & KIOState<T, R[]>>;
  getRecords<R extends Record, T extends string = string>(args: {
    tag: T,
    app: AppID,
    fields?: (keyof R)[],
    query?: string,
  }): KIO<S & KIOState<T, (R | Partial<R>)[]>> {
    const kio = Do(FR.free)
      .bind('state', this.kio)
      .bind('records', K.getRecords<R>(args))
      .return(({ state, records }) => ({
        ...state,
        [args.tag]: records,
      }));
    return new KIO(kio, this.autoCommitInterpreter);
  }

  addRecord<R extends Record, T extends string = string>(args: {
    tag: T,
    app: AppID,
    record: R,
  }): KIO<S & KIOState<T, R>> {
    const kio = Do(FR.free)
      .bind('state', this.kio)
      .bind('result', K.addRecord(args))
      .return(({ state, result }) => ({
        ...state,
        [args.tag]: O.foldW(
          () => args.record,
          (r: { id: ID, revision: Revision }) => ({
            ...args.record,
            $id: { type: '__ID__', value: r.id },
            $revision: { type: '__REVISION__', value: r.revision },
          }),
        )(result),
      }));
    return new KIO(kio, this.autoCommitInterpreter);
  }

  updateRecordById<R extends Record, T extends string = string>(args: {
    tag: T,
    app: AppID,
    id: ID,
    record: R,
  }): KIO<S & KIOState<T, R>> {
    const kio = Do(FR.free)
      .bind('state', this.kio)
      .bind('result', K.updateRecordById(args))
      .return(({ state, result }) => ({
        ...state,
        [args.tag]: O.foldW(
          () => args.record,
          (r: { revision: Revision }) => ({
            ...args.record,
            $id: { type: '__ID__', value: args.id },
            $revision: { type: '__REVISION__', value: r.revision },
          }),
        )(result),
      }));
    return new KIO(kio, this.autoCommitInterpreter);
  }

  updateRecordByUpdateKey<R extends Record, T extends string = string>(args: {
    tag: T,
    app: AppID,
    updateKey: { field: keyof R, value: ID },
    record: R,
  }): KIO<S & KIOState<T, R>> {
    const kio = Do(FR.free)
      .bind('state', this.kio)
      .bind('result', K.updateRecordByUpdateKey(args))
      .return(({ state, result }) => ({
        ...state,
        [args.tag]: O.foldW(
          () => args.record,
          (r: { revision: Revision }) => ({
            ...args.record,
            $revision: { type: '__REVISION__', value: r.revision },
          }),
        )(result),
      }));
    return new KIO(kio, this.autoCommitInterpreter);
  }

  deleteRecords(args: {
    app: AppID,
    records: { id: ID, revision?: Revision }[],
  }): KIO<S> {
    const kio = Do(FR.free)
      .bind('state', this.kio)
      .bind('result', K.deleteRecords(args))
      .return(({ state }) => state);
    return new KIO(kio, this.autoCommitInterpreter);
  }

  async commit<A>(result: (s: S) => A): Promise<A> {
    const kio = Do(FR.free)
      .bind('state', this.kio)
      .return(({ state }) => result(state));
    return FR.foldFree(T.Monad)(this.autoCommitInterpreter.translate, kio)();
  }
}
