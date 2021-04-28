import type { ISaveConverter0_0 } from "./ISaveConverter0_0";
import type { ISaveDataInstance0_0, ISaveDataStatic0_0 } from "./ISaveData0_0";
import type { ISavingConstants0_0 } from "./ISavingConstants0_0";
import type { ISaveVersioned } from "../../../interfaces/ISaveVersioned";

export interface ISavingSystem0_0 extends ISaveVersioned {
  saveData: ISaveDataInstance0_0;
  saveDataType: ISaveDataStatic0_0;
  savingConstants: ISavingConstants0_0;
  converter: ISaveConverter0_0;

  save: () => void;

  load: () => void;

  loadRawSave: (rawObjectSaved: string) => void;

  loadActualSave: (actualSave: ISaveVersioned) => void;
}
