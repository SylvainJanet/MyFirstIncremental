import type { ISaveDataInstance01, ISaveDataStatic01 } from "./ISaveData01";
import type { ISavingConstants01 } from "./ISavingConstants01";
import type { SavingVersion } from "../../../SavingVersion";

export interface ISavingSystem01 {
  saveData: ISaveDataInstance01;
  saveDataType: ISaveDataStatic01;
  savingConstants: ISavingConstants01;
  version: SavingVersion;

  save: () => void;

  load: () => void;

  loadRawSave: (rawObjectSaved: string) => void;

  loadActualSave: (actualSave: unknown) => void;
}
