import type { ISavingSystem0_0 } from "./../_interfaces/ISavingSystem0_0";
import { SaveDataInstance0_0_2, SaveDataStatic0_0_2 } from "./SaveData0_0_2";
import { SavingConstants0_0_2 } from "./SavingConstants0_0_2";
import { SavingVersion } from "../../../SavingVersion";
import { SaveConverter0_0_2 } from "./SaveConverter0_0_2";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

export const SavingSystem0_0_2: ISavingSystem0_0 = {
  saveData: SaveDataInstance0_0_2,
  saveDataType: SaveDataStatic0_0_2,
  savingConstants: SavingConstants0_0_2,
  version: SavingVersion["0.0.2"],
  converter: SaveConverter0_0_2,
  /*
   *  SaveConverter: SaveConverter0_0_2,
   * previousSaveData: SaveData001.prototype,
   */

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

  loadActualSave(actualSaveInput: any): void {
    const actualSave = actualSaveInput;
    /*
     * If (actualSave.version < this.version) {
     *   actualSave = this.loadActualPreviousSave(actualSave);
     * }
     */
    if (actualSave.version === this.version) {
      this.saveData = actualSave;
      this.saveDataType.loadSaveData(this.saveData);
      return;
    }
    console.log("incompatible version");
  },

  /*
   * LoadActualPreviousSave(actualSaveInput: any): any {
   *  Const actualSave = actualSaveInput;
   */
  /*
   * If (actualSave.version < this.version - 1) {
   *   actualSave = this.loadActualPreviousSave(actualSave);
   * }
   * if (actualSave.version === this.version - 1) {
   *   actualSave = this.saveConverter.convert(actualSave as SaveData001);
   * }
   */
  // },
};
