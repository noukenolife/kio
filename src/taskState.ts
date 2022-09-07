import * as T from 'fp-ts/Task';
import * as STT from 'fp-ts/StateT';
import { Pointed2 } from 'fp-ts/Pointed';
import { pipe } from 'fp-ts/function';
import { Functor2 } from 'fp-ts/Functor';
import { Apply2 } from 'fp-ts/Apply';
import { Chain2 } from 'fp-ts/Chain';
import { Monad2 } from 'fp-ts/Monad';

export const URI = 'TaskState';

export type TaskState<S, A> = STT.StateT1<T.URI, S, A>;

export type URI = typeof URI;

declare module 'fp-ts/HKT' {
  interface URItoKind2<E, A> {
    readonly [URI]: TaskState<E, A>
  }
}

export const of = STT.of(T.Pointed);

export const map = STT.map(T.Functor);

export const chain = STT.chain(T.Chain);

export const fromTask: <S, A>(ma: T.Task<A>) => TaskState<S, A> = STT.fromF(T.Functor);

export const fromState = STT.fromState(T.Pointed);

const mapFn: Functor2<URI>['map'] = (fa, f) => pipe(fa, map(f));
const apFn: Apply2<URI>['ap'] = (fab, fa) => pipe(
  fab,
  chain((f) => pipe(fa, map(f))),
);
const chainFn: Chain2<URI>['chain'] = (ma, f) => pipe(ma, chain(f));

export const Pointed: Pointed2<URI> = {
  URI,
  of,
};

export const Functor: Functor2<URI> = {
  URI,
  map: mapFn,
};

export const Monad: Monad2<URI> = {
  URI,
  of,
  ap: apFn,
  map: mapFn,
  chain: chainFn,
};
