import * as FR from 'fp-ts-contrib/Free';
import * as T from 'fp-ts/Task';
import * as K from '../kioa';

export type Interpreter = {
  translate: <A>(kio: FR.Free<K.URI, A>) => T.Task<A>
};
