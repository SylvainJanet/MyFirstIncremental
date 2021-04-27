import type { ISaveDataInstance10, ISaveDataStatic10 } from "./ISaveData10";
import type { ISavingConstants10 } from "./ISavingConstants10";
import type { SavingVersion } from "../../../SavingVersion";

export interface ISavingSystem10 {
  saveData: ISaveDataInstance10;
  saveDataType: ISaveDataStatic10;
  savingConstants: ISavingConstants10;
  version: SavingVersion;

  save: () => void;

  load: () => void;

  loadRawSave: (rawObjectSaved: string) => void;

  loadActualSave: (actualSave: unknown) => void;
}
