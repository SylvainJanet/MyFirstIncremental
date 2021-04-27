import type { ISaveDataInstance00, ISaveDataStatic00 } from "./ISaveData00";
import type { ISavingConstants00 } from "./ISavingConstants00";
import type { SavingVersion } from "../../../SavingVersion";

export interface ISavingSystem00 {
  saveData: ISaveDataInstance00;
  saveDataType: ISaveDataStatic00;
  savingConstants: ISavingConstants00;
  version: SavingVersion;

  save: () => void;

  load: () => void;

  loadRawSave: (rawObjectSaved: string) => void;

  loadActualSave: (actualSave: unknown) => void;
}
