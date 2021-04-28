import { SavingConstants1_0_0 } from "./SavingConstants1_0_0";
import { SaveDataInstance1_0_0, SaveDataStatic1_0_0 } from "./SaveData1_0_0";
import type { ISavingSystem1_0 } from "../_interfaces/ISavingSystem1_0";
import { SavingVersion } from "../../../SavingVersion";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

export const SavingSystem1_0_0: ISavingSystem1_0 = {
  saveData: SaveDataInstance1_0_0,
  saveDataType: SaveDataStatic1_0_0,
  savingConstants: SavingConstants1_0_0,
  version: SavingVersion["1.0.0"],
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
