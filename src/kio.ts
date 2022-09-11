import * as FR from 'fp-ts-contrib/Free';
import * as O from 'fp-ts/Option';
import { Do } from 'fp-ts-contrib/Do';
import {
  AppID, ID, Record, Revision,
} from './core';
import * as K from './kioa';
import { Interpreter } from './interpreter/interpreter';

export type KIOState<T extends string, A> = {
  [K in T]?: A
};

export class KIO<S extends {}> {
  private readonly kio: FR.Free<K.URI, S>;

  private readonly autoCommitInterpreter: Interpreter;

  private readonly transactionalCommitInterpreter: Interpreter;

  private constructor(
    kio: FR.Free<K.URI, S>,
    autoCommitInterpreter: Interpreter,
    transactionalCommitInterpreter: Interpreter,
  ) {
    this.kio = kio;
    this.autoCommitInterpreter = autoCommitInterpreter;
    this.transactionalCommitInterpreter = transactionalCommitInterpreter;
  }

  static instance(autoCommitInterpreter: Interpreter, transactionalCommitInterpreter: Interpreter) {
    return new KIO(FR.of({}), autoCommitInterpreter, transactionalCommitInterpreter);
  }

  map<T extends Extract<keyof S, string>>(tag: T): <A>(
    f: (value: S[T]) => A | Promise<A>,
  ) => KIO<Omit<S, T> & KIOState<T, A>> {
    return (f) => {
      const kio = Do(FR.free)
        .bind('state', this.kio)
        .bindL('newState', ({ state }) => K.async({
          a: async () => ({
            ...state,
            [tag]: await f(state[tag]),
          }),
        }))
        .return(({ newState }) => newState);
      return new KIO(kio, this.autoCommitInterpreter, this.transactionalCommitInterpreter);
    };
  }

  getRecordOpt<T extends string>(tag: T): <R extends Record>(args: {
    app: AppID,
    id: ID,
  }) => KIO<S & KIOState<T, R | undefined>> {
    return (args) => {
      const kio = Do(FR.free)
        .bind('state', this.kio)
        .bind('record', K.getRecordOpt(args))
        .return(({ state, record }) => ({
          ...state,
          [tag]: O.toUndefined(record),
        }));
      return new KIO(kio, this.autoCommitInterpreter, this.transactionalCommitInterpreter);
    };
  }

  getRecords<T extends string>(tag: T): <R extends Record>(args: {
    app: AppID,
    query?: string,
  }) => KIO<S & KIOState<T, R[]>>;
  getRecords<T extends string>(tag: T): <R extends Record>(args: {
    app: AppID,
    fields: [],
    query?: string,
  }) => KIO<S & KIOState<T, R[]>>;
  getRecords<T extends string>(tag: T): <R extends Record> (args: {
    app: AppID,
    fields?: (keyof R)[],
    query?: string,
  }) => KIO<S & KIOState<T, (R | Partial<R>)[]>> {
    return (args) => {
      const kio = Do(FR.free)
        .bind('state', this.kio)
        .bind('records', K.getRecords(args))
        .return(({ state, records }) => ({
          ...state,
          [tag]: records,
        }));
      return new KIO(kio, this.autoCommitInterpreter, this.transactionalCommitInterpreter);
    };
  }

  addRecord<T extends string>(tag: T): <R extends Record>(args: {
    app: AppID,
    record: R,
  }) => KIO<S & KIOState<T, R>> {
    return (args) => {
      const kio = Do(FR.free)
        .bind('state', this.kio)
        .bind('result', K.addRecord(args))
        .return(({ state, result }) => ({
          ...state,
          [tag]: O.foldW(
            () => args.record,
            (r: { id: ID, revision: Revision }) => ({
              ...args.record,
              $id: { type: '__ID__', value: r.id },
              $revision: { type: '__REVISION__', value: r.revision },
            }),
          )(result),
        }));
      return new KIO(kio, this.autoCommitInterpreter, this.transactionalCommitInterpreter);
    };
  }

  updateRecordById<T extends string>(tag: T): <R extends Record>(args: {
    app: AppID,
    id: ID,
    record: R,
  }) => KIO<S & KIOState<T, R>> {
    return (args) => {
      const kio = Do(FR.free)
        .bind('state', this.kio)
        .bind('result', K.updateRecordById(args))
        .return(({ state, result }) => ({
          ...state,
          [tag]: O.foldW(
            () => args.record,
            (r: { revision: Revision }) => ({
              ...args.record,
              $id: { type: '__ID__', value: args.id },
              $revision: { type: '__REVISION__', value: r.revision },
            }),
          )(result),
        }));
      return new KIO(kio, this.autoCommitInterpreter, this.transactionalCommitInterpreter);
    };
  }

  updateRecordByUpdateKey<T extends string>(tag: T): <R extends Record>(args: {
    app: AppID,
    updateKey: { field: keyof R, value: ID },
    record: R,
  }) => KIO<S & KIOState<T, R>> {
    return (args) => {
      const kio = Do(FR.free)
        .bind('state', this.kio)
        .bind('result', K.updateRecordByUpdateKey(args))
        .return(({ state, result }) => ({
          ...state,
          [tag]: O.foldW(
            () => args.record,
            (r: { revision: Revision }) => ({
              ...args.record,
              $revision: { type: '__REVISION__', value: r.revision },
            }),
          )(result),
        }));
      return new KIO(kio, this.autoCommitInterpreter, this.transactionalCommitInterpreter);
    };
  }

  deleteRecords(args: {
    app: AppID,
    records: { id: ID, revision?: Revision }[],
  }): KIO<S> {
    const kio = Do(FR.free)
      .bind('state', this.kio)
      .bind('result', K.deleteRecords(args))
      .return(({ state }) => state);
    return new KIO(kio, this.autoCommitInterpreter, this.transactionalCommitInterpreter);
  }

  async commit<A>(result: (s: S) => A): Promise<A> {
    const kio = Do(FR.free)
      .bind('state', this.kio)
      .return(({ state }) => result(state));
    return this.autoCommitInterpreter.translate(kio)();
  }

  async commitTransactional<A>(result: (s: S) => A): Promise<A> {
    const kio = Do(FR.free)
      .bind('state', this.kio)
      .return(({ state }) => result(state));
    return this.transactionalCommitInterpreter.translate(kio)();
  }
}
