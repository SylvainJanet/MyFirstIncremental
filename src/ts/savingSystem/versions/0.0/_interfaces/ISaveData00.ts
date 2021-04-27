import type { SavingVersion } from "../../../SavingVersion";

export interface ISaveDataStatic00 {
  getSaveData: () => ISaveDataInstance00;
  loadSaveData: (save: ISaveDataInstance00) => void;
  new (value1: string): ISaveDataInstance00;
}

export interface ISaveDataInstance00 {
  version: SavingVersion;
  value1: string;
}
