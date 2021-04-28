import type { ISaveVersioned } from "../../../interfaces/ISaveVersioned";

export interface ISaveDataStatic0_2 {
  getSaveData: () => ISaveDataInstance0_2;
  loadSaveData: (save: ISaveDataInstance0_2) => void;
  new (value1: string, value2: string, value3: string): ISaveDataInstance0_2;
}

export interface ISaveDataInstance0_2 extends ISaveVersioned {
  value1: string;
  value2: string;
  value3: string;
}
