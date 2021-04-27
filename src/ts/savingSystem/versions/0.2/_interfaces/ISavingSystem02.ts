import type { ISaveDataInstance02, ISaveDataStatic02 } from "./ISaveData02";
import type { ISavingConstants02 } from "./ISavingConstants02";
import type { SavingVersion } from "../../../SavingVersion";

export interface ISavingSystem02 {
  saveData: ISaveDataInstance02;
  saveDataType: ISaveDataStatic02;
  savingConstants: ISavingConstants02;
  version: SavingVersion;

  save: () => void;

  load: () => void;

  loadRawSave: (rawObjectSaved: string) => void;

  loadActualSave: (actualSave: unknown) => void;
}
