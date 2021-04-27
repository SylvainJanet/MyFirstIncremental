import { SavingVersion } from "../../../SavingVersion";
import type { ISaveDataStatic01, ISaveDataInstance01 } from "./../_interfaces/ISaveData01";
import { SavingConstants010 } from "./SavingConstants010";
export const SaveDataStatic010: ISaveDataStatic01 = class SaveDataInstance010 implements ISaveDataInstance01 {
  public version = SavingVersion["0.1.0"];

  public value1: string;

  public value2: string;

  public constructor(value1: string, value2: string) {
    this.value1 = value1;
    this.value2 = value2;
  }

  public static getSaveData(): SaveDataInstance010 {
    const elementValue1 = document.getElementById(SavingConstants010.idValue1);
    const elementValue2 = document.getElementById(SavingConstants010.idValue2);
    const value1 = (elementValue1 as HTMLInputElement).value;
    const value2 = (elementValue2 as HTMLInputElement).value;

    return new SaveDataInstance010(value1, value2);
  }

  public static loadSaveData(save: SaveDataInstance010): void {
    const elementValue1 = document.getElementById(SavingConstants010.idValue1);
    const elementValue2 = document.getElementById(SavingConstants010.idValue2);
    (elementValue1 as HTMLInputElement).value = save.value1;
    (elementValue2 as HTMLInputElement).value = save.value2;
  }
};

export const SaveDataInstance010: ISaveDataInstance01 = SaveDataStatic010.prototype as ISaveDataInstance01;
