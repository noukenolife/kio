export const ERR_CODE_RECORD_NOT_FOUND = 'GAIA_RE01';
export type KintoneClientError<C extends string> = {
  code: C
  cause?: Error
};
