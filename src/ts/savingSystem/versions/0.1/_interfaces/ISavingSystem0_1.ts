import type { ISaveDataInstance0_1, ISaveDataStatic0_1 } from "./ISaveData0_1";
import type { ISavingConstants0_1 } from "./ISavingConstants0_1";
import type { ISaveVersioned } from "../../../interfaces/ISaveVersioned";

export interface ISavingSystem0_1 extends ISaveVersioned {
  saveData: ISaveDataInstance0_1;
  saveDataType: ISaveDataStatic0_1;
  savingConstants: ISavingConstants0_1;

  save: () => void;

  load: () => void;

  loadRawSave: (rawObjectSaved: string) => void;

  loadActualSave: (actualSave: unknown) => void;
}
