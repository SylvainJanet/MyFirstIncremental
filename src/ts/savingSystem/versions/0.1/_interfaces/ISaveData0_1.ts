import type { ISaveVersioned } from "../../../interfaces/ISaveVersioned";

export interface ISaveDataStatic0_1 {
  getSaveData: () => ISaveDataInstance0_1;
  loadSaveData: (save: ISaveDataInstance0_1) => void;
  new (value1: string, value2: string): ISaveDataInstance0_1;
}

export interface ISaveDataInstance0_1 extends ISaveVersioned {
  value1: string;
  value2: string;
}
