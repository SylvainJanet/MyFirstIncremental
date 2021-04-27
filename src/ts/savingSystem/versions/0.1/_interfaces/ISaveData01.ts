import type { SavingVersion } from "../../../SavingVersion";

export interface ISaveDataStatic01 {
  getSaveData: () => ISaveDataInstance01;
  loadSaveData: (save: ISaveDataInstance01) => void;
  new (value1: string, value2: string): ISaveDataInstance01;
}

export interface ISaveDataInstance01 {
  version: SavingVersion;
  value1: string;
  value2: string;
}
