/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { SavingVersion } from "./../../SavingVersion";
import { SavingConstants00 } from "./SavingConstants00";
import { SaveData00 } from "./SaveData00";

export const SavingSystem00 = {
  saveData: SaveData00.prototype,
  saveDataType: SaveData00,
  savingConstants: SavingConstants00,
  version: SavingVersion["0.0"],

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

  loadActualSave(actualSave: any): void {
    if (actualSave.version !== SavingVersion["0.0"]) {
      console.log("incompatible version");
    }
    this.saveData = actualSave;
    this.saveDataType.loadSaveData(this.saveData);
  },
};
