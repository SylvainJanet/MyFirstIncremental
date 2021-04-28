import type { ISaveVersioned } from "../../../interfaces/ISaveVersioned";

export interface ISaveDataStatic1_0 {
  getSaveData: () => ISaveDataInstance1_0;
  loadSaveData: (save: ISaveDataInstance1_0) => void;
  new (value1: string, value2: string, value3: string): ISaveDataInstance1_0;
}

export interface ISaveDataInstance1_0 extends ISaveVersioned {
  value1: string;
  value2: string;
  value3: string;
}
