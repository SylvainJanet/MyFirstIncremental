import { SavingConstants002 } from "./SavingConstants002";
export class SaveData002 {
  public version = "0.0.2";

  public value1: string;

  public value2: string;

  public value3: string;

  public constructor(value1: string, value2: string, value3: string) {
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
  }

  public static getSaveData(): SaveData002 {
    const elementValue1 = document.getElementById(SavingConstants002.idValue1);
    const elementValue2 = document.getElementById(SavingConstants002.idValue2);
    const elementValue3 = document.getElementById(SavingConstants002.idValue3);
    const value1 = (elementValue1 as HTMLInputElement).value;
    const value2 = (elementValue2 as HTMLInputElement).value;
    const value3 = (elementValue3 as HTMLInputElement).value;
    return new SaveData002(value1, value2, value3);
  }

  public static loadSaveData(save: SaveData002): void {
    const elementValue1 = document.getElementById(SavingConstants002.idValue1);
    const elementValue2 = document.getElementById(SavingConstants002.idValue2);
    const elementValue3 = document.getElementById(SavingConstants002.idValue3);
    (elementValue1 as HTMLInputElement).value = save.value1;
    (elementValue2 as HTMLInputElement).value = save.value2;
    (elementValue3 as HTMLInputElement).value = save.value3;
  }
}
