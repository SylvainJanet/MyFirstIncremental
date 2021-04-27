import type { ISavingSystem00 } from "../_interfaces/ISavingSystem00";
import { SavingVersion } from "./../../../SavingVersion";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { SaveData001 } from "./SaveData001";
import { SavingConstants001 } from "./SavingConstants001";

export const SavingSystem001: ISavingSystem00 = {
  saveData: SaveData001.getSaveData(),
  saveDataType: SaveData001,
  savingConstants: SavingConstants001,
  version: SavingVersion["0.0.1"],

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
    if (actualSave.version < this.version) {
      console.log("incompatible version");
    }
    this.saveData = actualSave;
    this.saveDataType.loadSaveData(this.saveData);
  },
};
