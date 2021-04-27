import { SavingConstants020 } from "./SavingConstants020";
import { SavingVersion } from "../../../SavingVersion";
import type { ISaveDataInstance02, ISaveDataStatic02 } from "./../_interfaces/ISaveData02";
export const SaveDataStatic020: ISaveDataStatic02 = class SaveDataInstance020 implements ISaveDataInstance02 {
  public version = SavingVersion["0.2.0"];

  public value1: string;

  public value2: string;

  public value3: string;

  public constructor(value1: string, value2: string, value3: string) {
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
  }

  public static getSaveData(): SaveDataInstance020 {
    const elementValue1 = document.getElementById(SavingConstants020.idValue1);
    const elementValue2 = document.getElementById(SavingConstants020.idValue2);
    const elementValue3 = document.getElementById(SavingConstants020.idValue3);
    const value1 = (elementValue1 as HTMLInputElement).value;
    const value2 = (elementValue2 as HTMLInputElement).value;
    const value3 = (elementValue3 as HTMLInputElement).value;

    return new SaveDataInstance020(value1, value2, value3);
  }

  public static loadSaveData(save: SaveDataInstance020): void {
    const elementValue1 = document.getElementById(SavingConstants020.idValue1);
    const elementValue2 = document.getElementById(SavingConstants020.idValue2);
    const elementValue3 = document.getElementById(SavingConstants020.idValue3);
    (elementValue1 as HTMLInputElement).value = save.value1;
    (elementValue2 as HTMLInputElement).value = save.value2;
    (elementValue3 as HTMLInputElement).value = save.value3;
  }
};

export const SaveDataInstance020: ISaveDataInstance02 = SaveDataStatic020.prototype as ISaveDataInstance02;
