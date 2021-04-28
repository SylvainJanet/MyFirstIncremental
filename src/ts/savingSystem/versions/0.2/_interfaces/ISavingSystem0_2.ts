import type { ISaveDataInstance0_2, ISaveDataStatic0_2 } from "./ISaveData0_2";
import type { ISavingConstants0_2 } from "./ISavingConstants0_2";
import type { ISaveVersioned } from "../../../interfaces/ISaveVersioned";

export interface ISavingSystem0_2 extends ISaveVersioned {
  saveData: ISaveDataInstance0_2;
  saveDataType: ISaveDataStatic0_2;
  savingConstants: ISavingConstants0_2;

  save: () => void;

  load: () => void;

  loadRawSave: (rawObjectSaved: string) => void;

  loadActualSave: (actualSave: unknown) => void;
}
