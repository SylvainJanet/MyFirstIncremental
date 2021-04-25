import type { SaveData00 } from "./../0.0/SaveData00";
import { SaveConverter002 } from "./SaveConverter002";
import { SavingVersion } from "./../../SavingVersion";
import { SaveData002 } from "./SaveData002";
import { SavingConstants002 } from "./SavingConstants002";
import type { SaveData001 } from "../0.0.1/SaveData001";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

export const SavingSystem002 = {
  saveData: SaveData002.prototype,
  saveDataType: SaveData002,
  savingConstants: SavingConstants002,
  version: SavingVersion["0.0.2"],
  saveConverter: SaveConverter002,

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
    if (actualSave.version === SavingVersion["0.0"]) {
      // eslint-disable-next-line no-param-reassign
      actualSave = this.saveConverter.convert00(actualSave as SaveData00);
    }
    if (actualSave.version === SavingVersion["0.0.1"]) {
      // eslint-disable-next-line no-param-reassign
      actualSave = this.saveConverter.convert001(actualSave as SaveData001);
    }
    if (actualSave.version === SavingVersion["0.0.2"]) {
      this.saveData = actualSave;
      this.saveDataType.loadSaveData(this.saveData);
      return;
    }
    console.log("incompatible version");
  },
};
