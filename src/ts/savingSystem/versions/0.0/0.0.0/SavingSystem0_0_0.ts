import { TypeHelperSavingSystem0_0 } from "./../_helper/TypeHelperSavingSystem0_0";
import { SaveConverter0_0_0 } from "./SaveConverter0_0_0";
import { SavingVersion } from "../../../SavingVersion";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { SavingConstants0_0_0 } from "./SavingConstants0_0_0";
import type { ISavingSystem0_0 } from "../_interfaces/ISavingSystem0_0";
import type { ISaveVersioned } from "../../../interfaces/ISaveVersioned";
import { isSaveVersioned } from "../../../interfaces/ISaveVersioned";
import { SaveDataInstance0_0_0, SaveDataStatic0_0_0 } from "./SaveData0_0_0";

export const SavingSystem0_0_0: ISavingSystem0_0 = {
  saveData: SaveDataInstance0_0_0.getSaveData(),
  saveDataType: SaveDataStatic0_0_0,
  savingConstants: SavingConstants0_0_0,
  version: SavingVersion["0.0.0"],
  converter: SaveConverter0_0_0,

  save(): void {
    this.saveData = this.saveDataType.getSaveData();
    localStorage.setItem(this.savingConstants.storageName, JSON.stringify(this.saveData));
  },

  load(): void {
    const rawObjectSaved = localStorage.getItem(this.savingConstants.storageName);
    if (rawObjectSaved === null) {
      console.log("no save found");
      return;
    }
    this.loadRawSave(rawObjectSaved);
  },

  loadRawSave(rawObjectSaved: string): void {
    const anyObjectSaved = JSON.parse(rawObjectSaved);
    if (isSaveVersioned(anyObjectSaved)) {
      this.loadActualSave(anyObjectSaved);
    }
  },

  loadActualSave(actualSave: ISaveVersioned): void {
    let modifiedSave = actualSave;
    if (modifiedSave.version !== this.version) {
      modifiedSave = this.converter.convert(modifiedSave);
    }
    if (TypeHelperSavingSystem0_0.isSaveData(modifiedSave) && modifiedSave.version === this.version) {
      this.saveData = modifiedSave;
      this.saveDataType.loadSaveData(this.saveData);
    } else {
      console.log(this.version);
      console.log("file corrupt");
    }
  },
};
