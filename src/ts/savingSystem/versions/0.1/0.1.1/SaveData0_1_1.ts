import { SavingVersion } from "../../../SavingVersion";
import type { ISaveDataStatic0_1, ISaveDataInstance0_1 } from "../_interfaces/ISaveData0_1";
import { SavingConstants0_1_1 } from "./SavingConstants0_1_1";
export const SaveDataStatic0_1_1: ISaveDataStatic0_1 = class SaveDataInstance0_1_1 implements ISaveDataInstance0_1 {
  public version = SavingVersion["0.1.1"];

  public value1: string;

  public value2: string;

  public constructor(value1: string, value2: string) {
    this.value1 = value1;
    this.value2 = value2;
  }

  public static getSaveData(): SaveDataInstance0_1_1 {
    const elementValue1 = document.getElementById(SavingConstants0_1_1.idValue1);
    const elementValue2 = document.getElementById(SavingConstants0_1_1.idValue2);
    const value1 = (elementValue1 as HTMLInputElement).value;
    const value2 = (elementValue2 as HTMLInputElement).value;

    return new SaveDataInstance0_1_1(value1, value2);
  }

  public static loadSaveData(save: SaveDataInstance0_1_1): void {
    const elementValue1 = document.getElementById(SavingConstants0_1_1.idValue1);
    const elementValue2 = document.getElementById(SavingConstants0_1_1.idValue2);
    (elementValue1 as HTMLInputElement).value = save.value1;
    (elementValue2 as HTMLInputElement).value = save.value2;
  }
};

export const SaveDataInstance0_1_1: ISaveDataInstance0_1 = SaveDataStatic0_1_1.prototype as ISaveDataInstance0_1;
