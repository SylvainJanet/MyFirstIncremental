import { SavingConstants0_2_0 } from "./SavingConstants0_2_0";
import { SavingVersion } from "../../../SavingVersion";
import type { ISaveDataInstance0_2, ISaveDataStatic0_2 } from "../_interfaces/ISaveData0_2";
export const SaveDataStatic0_2_0: ISaveDataStatic0_2 = class SaveDataInstance0_2_0 implements ISaveDataInstance0_2 {
  public version = SavingVersion["0.2.0"];

  public value1: string;

  public value2: string;

  public value3: string;

  public constructor(value1: string, value2: string, value3: string) {
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
  }

  public static getSaveData(): SaveDataInstance0_2_0 {
    const elementValue1 = document.getElementById(SavingConstants0_2_0.idValue1);
    const elementValue2 = document.getElementById(SavingConstants0_2_0.idValue2);
    const elementValue3 = document.getElementById(SavingConstants0_2_0.idValue3);
    const value1 = (elementValue1 as HTMLInputElement).value;
    const value2 = (elementValue2 as HTMLInputElement).value;
    const value3 = (elementValue3 as HTMLInputElement).value;

    return new SaveDataInstance0_2_0(value1, value2, value3);
  }

  public static loadSaveData(save: SaveDataInstance0_2_0): void {
    const elementValue1 = document.getElementById(SavingConstants0_2_0.idValue1);
    const elementValue2 = document.getElementById(SavingConstants0_2_0.idValue2);
    const elementValue3 = document.getElementById(SavingConstants0_2_0.idValue3);
    (elementValue1 as HTMLInputElement).value = save.value1;
    (elementValue2 as HTMLInputElement).value = save.value2;
    (elementValue3 as HTMLInputElement).value = save.value3;
  }
};

export const SaveDataInstance0_2_0: ISaveDataInstance0_2 = SaveDataStatic0_2_0.prototype as ISaveDataInstance0_2;
