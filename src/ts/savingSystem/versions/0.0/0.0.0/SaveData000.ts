import type { ISaveDataInstance00, ISaveDataStatic00 } from "../_interfaces/ISaveData00";
import { SavingConstants000 } from "./SavingConstants000";
import { SavingVersion } from "../../../SavingVersion";

export const SaveDataStatic000: ISaveDataStatic00 = class SaveDataInstance000 implements ISaveDataInstance00 {
  public version = SavingVersion["0.0.0"];

  public value1: string;

  public constructor(value1: string) {
    this.value1 = value1;
  }

  public static getSaveData(): ISaveDataInstance00 {
    const elementValue1 = document.getElementById(SavingConstants000.idValue1);
    const value1 = (elementValue1 as HTMLInputElement).value;
    return new SaveDataInstance000(value1);
  }

  public static loadSaveData(save: ISaveDataInstance00): void {
    const elementValue1 = document.getElementById(SavingConstants000.idValue1);
    (elementValue1 as HTMLInputElement).value = save.value1;
  }
};
export const SaveDataInstance000: ISaveDataInstance00 = SaveDataStatic000.prototype as ISaveDataInstance00;
