import type { SaveData00 } from "./../0.0/SaveData00";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { SavingVersion } from "./../../SavingVersion";
import { SaveConverter001 } from "./SaveConverter001";
import { SaveData001 } from "./SaveData001";
import { SavingConstants001 } from "./SavingConstants001";

export const SavingSystem001 = {
  saveData: SaveData001.prototype,
  saveDataType: SaveData001,
  savingConstants: SavingConstants001,
  version: SavingVersion["0.0.1"],
  saveConverter: SaveConverter001,

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
      actualSave = this.saveConverter.convert(actualSave as SaveData00);
    }
    if (actualSave.version === SavingVersion["0.0.1"]) {
      this.saveData = actualSave;
      this.saveDataType.loadSaveData(this.saveData);
      return;
    }
    console.log("incompatible version");
  },
};
