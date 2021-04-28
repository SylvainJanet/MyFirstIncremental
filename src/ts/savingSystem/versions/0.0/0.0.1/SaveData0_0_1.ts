import { SavingVersion } from "../../../SavingVersion";
import type { ISaveDataInstance0_0, ISaveDataStatic0_0 } from "../_interfaces/ISaveData0_0";
import { SavingConstants0_0_1 } from "./SavingConstants0_0_1";

export const SaveDataStatic0_0_1: ISaveDataStatic0_0 = class SaveData0_0_1 implements ISaveDataInstance0_0 {
  public version = SavingVersion["0.0.1"];

  public value1: string;

  public constructor(value1: string) {
    this.value1 = value1;
  }

  public static getSaveData(): ISaveDataInstance0_0 {
    const elementValue1 = document.getElementById(SavingConstants0_0_1.idValue1);
    const value1 = (elementValue1 as HTMLInputElement).value;
    return new SaveData0_0_1(value1);
  }

  public static loadSaveData(save: ISaveDataInstance0_0): void {
    const elementValue1 = document.getElementById(SavingConstants0_0_1.idValue1);
    (elementValue1 as HTMLInputElement).value = save.value1;
  }
};
export const SaveDataInstance0_0_1: ISaveDataInstance0_0 = SaveDataStatic0_0_1.prototype as ISaveDataInstance0_0;
