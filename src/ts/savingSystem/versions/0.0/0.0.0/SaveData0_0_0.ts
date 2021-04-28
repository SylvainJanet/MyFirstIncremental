/* eslint-disable max-classes-per-file */
import type { ISaveDataInstance0_0, ISaveDataStatic0_0 } from "../_interfaces/ISaveData0_0";
import { SavingConstants0_0_0 } from "./SavingConstants0_0_0";
import { SavingVersion } from "../../../SavingVersion";

export class SaveDataInstance0_0_0 implements ISaveDataInstance0_0 {
  public version = SavingVersion["0.0.0"];

  public value1: string;

  public constructor(value1: string) {
    this.value1 = value1;
  }

  public static getSaveData(): ISaveDataInstance0_0 {
    const elementValue1 = document.getElementById(SavingConstants0_0_0.idValue1);
    const value1 = (elementValue1 as HTMLInputElement).value;
    return new SaveDataInstance0_0_0(value1);
  }

  public static loadSaveData(save: ISaveDataInstance0_0): void {
    const elementValue1 = document.getElementById(SavingConstants0_0_0.idValue1);
    (elementValue1 as HTMLInputElement).value = save.value1;
  }
}
export const SaveDataStatic0_0_0: ISaveDataStatic0_0 = SaveDataInstance0_0_0;
