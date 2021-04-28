import { SavingConstants1_0_0 } from "./SavingConstants1_0_0";
import { SavingVersion } from "../../../SavingVersion";
import type { ISaveDataInstance1_0, ISaveDataStatic1_0 } from "../_interfaces/ISaveData1_0";
export const SaveDataStatic1_0_0: ISaveDataStatic1_0 = class SaveDataInstance1_0_0 implements ISaveDataInstance1_0 {
  public version = SavingVersion["1.0.0"];

  public value1: string;

  public value2: string;

  public value3: string;

  public constructor(value1: string, value2: string, value3: string) {
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
  }

  public static getSaveData(): SaveDataInstance1_0_0 {
    const elementValue1 = document.getElementById(SavingConstants1_0_0.idValue1);
    const elementValue2 = document.getElementById(SavingConstants1_0_0.idValue2);
    const elementValue3 = document.getElementById(SavingConstants1_0_0.idValue3);
    const value1 = (elementValue1 as HTMLInputElement).value;
    const value2 = (elementValue2 as HTMLInputElement).value;
    const value3 = (elementValue3 as HTMLInputElement).value;

    return new SaveDataInstance1_0_0(value1, value2, value3);
  }

  public static loadSaveData(save: SaveDataInstance1_0_0): void {
    const elementValue1 = document.getElementById(SavingConstants1_0_0.idValue1);
    const elementValue2 = document.getElementById(SavingConstants1_0_0.idValue2);
    const elementValue3 = document.getElementById(SavingConstants1_0_0.idValue3);
    (elementValue1 as HTMLInputElement).value = save.value1;
    (elementValue2 as HTMLInputElement).value = save.value2;
    (elementValue3 as HTMLInputElement).value = save.value3;
  }
};

export const SaveDataInstance1_0_0: ISaveDataInstance1_0 = SaveDataStatic1_0_0.prototype as ISaveDataInstance1_0;
