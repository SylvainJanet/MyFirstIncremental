import type { ISaveVersioned } from "../../../interfaces/ISaveVersioned";

export interface ISaveDataStatic0_0 {
  getSaveData: () => ISaveDataInstance0_0;
  loadSaveData: (save: ISaveDataInstance0_0) => void;
  new (value1: string): ISaveDataInstance0_0;
}

export interface ISaveDataInstance0_0 extends ISaveVersioned {
  value1: string;
}
