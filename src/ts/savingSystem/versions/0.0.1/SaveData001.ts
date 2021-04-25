import { SavingConstants001 } from "./SavingConstants001";
export class SaveData001 {
  public version = "0.0.1";

  public value1: string;

  public value2: string;

  public constructor(value1: string, value2: string) {
    this.value1 = value1;
    this.value2 = value2;
  }

  public static getSaveData(): SaveData001 {
    const elementValue1 = document.getElementById(SavingConstants001.idValue1);
    const elementValue2 = document.getElementById(SavingConstants001.idValue2);
    const value1 = (elementValue1 as HTMLInputElement).value;
    const value2 = (elementValue2 as HTMLInputElement).value;

    return new SaveData001(value1, value2);
  }

  public static loadSaveData(save: SaveData001): void {
    const elementValue1 = document.getElementById(SavingConstants001.idValue1);
    const elementValue2 = document.getElementById(SavingConstants001.idValue2);
    (elementValue1 as HTMLInputElement).value = save.value1;
    (elementValue2 as HTMLInputElement).value = save.value2;
  }
}
