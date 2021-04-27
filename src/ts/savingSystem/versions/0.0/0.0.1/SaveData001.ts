import { SavingVersion } from "../../../SavingVersion";
import type { ISaveDataInstance00, ISaveDataStatic00 } from "../_interfaces/ISaveData00";
import { SavingConstants001 } from "./SavingConstants001";

export const SaveData001: ISaveDataStatic00 = class SaveData001 implements ISaveDataInstance00 {
  public version = SavingVersion["0.0.1"];

  public value1: string;

  public constructor(value1: string) {
    this.value1 = value1;
  }

  public static getSaveData(): ISaveDataInstance00 {
    const elementValue1 = document.getElementById(SavingConstants001.idValue1);
    const value1 = (elementValue1 as HTMLInputElement).value;
    return new SaveData001(value1);
  }

  public static loadSaveData(save: ISaveDataInstance00): void {
    const elementValue1 = document.getElementById(SavingConstants001.idValue1);
    (elementValue1 as HTMLInputElement).value = save.value1;
  }
};
