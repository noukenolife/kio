import * as T from 'fp-ts/Task';
import { Interpreter } from './interpreter';

export type AutoCommitInterpreter = Interpreter<T.URI>;
