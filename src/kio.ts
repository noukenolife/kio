import * as FR from 'fp-ts-contrib/Free';
import * as O from 'fp-ts/Option';
import * as T from 'fp-ts/Task';
import { Do } from 'fp-ts-contrib/Do';
import { AppID, ID, Record } from './core';
import { AutoCommitInterpreter } from './interpreter/autoCommitInterpreter';
import * as K from './kioa';

export type KIOState<T extends string, R extends Record> = {
  [K in T]?: R
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

  getRecordOpt<T extends string, R extends Record>(args: {
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

  async autoCommit<A>(result: (s: S) => A): Promise<A> {
    const kio = Do(FR.free)
      .bind('state', this.kio)
      .return(({ state }) => result(state));
    return FR.foldFree(T.Monad)(this.autoCommitInterpreter.translate, kio)();
  }
}
