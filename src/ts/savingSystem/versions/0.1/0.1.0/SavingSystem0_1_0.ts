import { SaveDataInstance0_1_0, SaveDataStatic0_1_0 } from "./SaveData0_1_0";
import { SavingConstants0_1_0 } from "./SavingConstants0_1_0";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { SavingVersion } from "../../../SavingVersion";
import type { ISavingSystem0_1 } from "../_interfaces/ISavingSystem0_1";

export const SavingSystem0_1_0: ISavingSystem0_1 = {
  saveData: SaveDataInstance0_1_0,
  saveDataType: SaveDataStatic0_1_0,
  savingConstants: SavingConstants0_1_0,
  version: SavingVersion["0.1.0"],
  // SaveConverter: SaveConverter010,

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
    this.loadActualSave(anyObjectSaved);
  },

  loadActualSave(actualSaveInput: any): void {
    const actualSave = actualSaveInput;
    /*
     * If (actualSave.version < this.version) {
     *   actualSave = this.saveConverter.convert(actualSave as SaveData010);
     * }
     */
    if (actualSave.version === this.version) {
      this.saveData = actualSave;
      this.saveDataType.loadSaveData(this.saveData);
      return;
    }
    console.log("incompatible version");
  },
};
