import { SaveConverter0_0_1 } from "./SaveConverter0_0_1";
import type { ISavingSystem0_0 } from "../_interfaces/ISavingSystem0_0";
import { SavingVersion } from "../../../SavingVersion";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { SaveDataStatic0_0_1, SaveDataInstance0_0_1 } from "./SaveData0_0_1";
import { SavingConstants0_0_1 } from "./SavingConstants0_0_1";

export const SavingSystem0_0_1: ISavingSystem0_0 = {
  saveData: SaveDataInstance0_0_1,
  saveDataType: SaveDataStatic0_0_1,
  savingConstants: SavingConstants0_0_1,
  version: SavingVersion["0.0.1"],
  converter: SaveConverter0_0_1,

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
    if (anyObjectSaved === null || typeof anyObjectSaved.version === "undefined") {
      console.log("corrupt file");
      return;
    }
    console.log("this.loadActualSave(anyObjectSaved)");
  },

  loadActualSave(actualSave: any): void {
    if (actualSave.version < this.version) {
      console.log("incompatible version");
    }
    this.saveData = actualSave;
    this.saveDataType.loadSaveData(this.saveData);
  },
};
