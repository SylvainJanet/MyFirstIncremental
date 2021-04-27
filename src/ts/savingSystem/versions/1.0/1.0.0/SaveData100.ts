import { SavingConstants100 } from "./SavingConstants100";
import { SavingVersion } from "../../../SavingVersion";
import type { ISaveDataInstance10, ISaveDataStatic10 } from "../_interfaces/ISaveData10";
export const SaveDataStatic100: ISaveDataStatic10 = class SaveDataInstance100 implements ISaveDataInstance10 {
  public version = SavingVersion["1.0.0"];

  public value1: string;

  public value2: string;

  public value3: string;

  public constructor(value1: string, value2: string, value3: string) {
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
  }

  public static getSaveData(): SaveDataInstance100 {
    const elementValue1 = document.getElementById(SavingConstants100.idValue1);
    const elementValue2 = document.getElementById(SavingConstants100.idValue2);
    const elementValue3 = document.getElementById(SavingConstants100.idValue3);
    const value1 = (elementValue1 as HTMLInputElement).value;
    const value2 = (elementValue2 as HTMLInputElement).value;
    const value3 = (elementValue3 as HTMLInputElement).value;

    return new SaveDataInstance100(value1, value2, value3);
  }

  public static loadSaveData(save: SaveDataInstance100): void {
    const elementValue1 = document.getElementById(SavingConstants100.idValue1);
    const elementValue2 = document.getElementById(SavingConstants100.idValue2);
    const elementValue3 = document.getElementById(SavingConstants100.idValue3);
    (elementValue1 as HTMLInputElement).value = save.value1;
    (elementValue2 as HTMLInputElement).value = save.value2;
    (elementValue3 as HTMLInputElement).value = save.value3;
  }
};

export const SaveDataInstance100: ISaveDataInstance10 = SaveDataStatic100.prototype as ISaveDataInstance10;
