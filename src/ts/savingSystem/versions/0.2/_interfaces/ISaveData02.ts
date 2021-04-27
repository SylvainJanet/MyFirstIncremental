import type { SavingVersion } from "../../../SavingVersion";

export interface ISaveDataStatic02 {
  getSaveData: () => ISaveDataInstance02;
  loadSaveData: (save: ISaveDataInstance02) => void;
  new (value1: string, value2: string, value3: string): ISaveDataInstance02;
}

export interface ISaveDataInstance02 {
  version: SavingVersion;
  value1: string;
  value2: string;
  value3: string;
}
