import type { SavingVersion } from "../../../SavingVersion";

export interface ISaveDataStatic10 {
  getSaveData: () => ISaveDataInstance10;
  loadSaveData: (save: ISaveDataInstance10) => void;
  new (value1: string, value2: string, value3: string): ISaveDataInstance10;
}

export interface ISaveDataInstance10 {
  version: SavingVersion;
  value1: string;
  value2: string;
  value3: string;
}
