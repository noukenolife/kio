import { Kind, URIS } from 'fp-ts/HKT';
import { KIOA } from '../kioa';

export type Interpreter<F extends URIS> = {
  translate: <A>(kioa: KIOA<A>) => Kind<F, A>
};
