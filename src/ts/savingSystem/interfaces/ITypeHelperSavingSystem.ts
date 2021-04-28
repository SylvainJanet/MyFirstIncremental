import type { ISaveVersioned } from "./ISaveVersioned";
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ITypeHelperSavingSystem<T extends ISaveVersioned> {
  isSaveData: (object: any) => object is T;
  getSaveData: (object: any) => T;
}
