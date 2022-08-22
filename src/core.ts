export type AppID = number | string;
export type ID = number | string;
export type FieldWith<T extends string, V> = {
  type: T;
  value: V;
};
export type IDField = FieldWith<'__ID__', string>;
export type RevisionField = FieldWith<'__REVISION__', string>;
export type Record = {
  $id: IDField,
  $revision: RevisionField
};
