import { SavingVersion } from "../../../SavingVersion";
import type { ISaveDataStatic01, ISaveDataInstance01 } from "../_interfaces/ISaveData01";
import { SavingConstants011 } from "./SavingConstants011";
export const SaveDataStatic011: ISaveDataStatic01 = class SaveDataInstance011 implements ISaveDataInstance01 {
  public version = SavingVersion["0.1.1"];

  public value1: string;

  public value2: string;

  public constructor(value1: string, value2: string) {
    this.value1 = value1;
    this.value2 = value2;
  }

  public static getSaveData(): SaveDataInstance011 {
    const elementValue1 = document.getElementById(SavingConstants011.idValue1);
    const elementValue2 = document.getElementById(SavingConstants011.idValue2);
    const value1 = (elementValue1 as HTMLInputElement).value;
    const value2 = (elementValue2 as HTMLInputElement).value;

    return new SaveDataInstance011(value1, value2);
  }

  public static loadSaveData(save: SaveDataInstance011): void {
    const elementValue1 = document.getElementById(SavingConstants011.idValue1);
    const elementValue2 = document.getElementById(SavingConstants011.idValue2);
    (elementValue1 as HTMLInputElement).value = save.value1;
    (elementValue2 as HTMLInputElement).value = save.value2;
  }
};

export const SaveDataInstance011: ISaveDataInstance01 = SaveDataStatic011.prototype as ISaveDataInstance01;
