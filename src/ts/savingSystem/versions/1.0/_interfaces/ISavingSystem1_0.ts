import type { ISaveDataInstance1_0, ISaveDataStatic1_0 } from "./ISaveData1_0";
import type { ISavingConstants1_0 } from "./ISavingConstants1_0";
import type { ISaveVersioned } from "../../../interfaces/ISaveVersioned";

export interface ISavingSystem1_0 extends ISaveVersioned {
  saveData: ISaveDataInstance1_0;
  saveDataType: ISaveDataStatic1_0;
  savingConstants: ISavingConstants1_0;

  save: () => void;

  load: () => void;

  loadRawSave: (rawObjectSaved: string) => void;

  loadActualSave: (actualSave: unknown) => void;
}
