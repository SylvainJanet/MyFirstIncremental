import { SavingConstants00 } from "./SavingConstants00";

export class SaveData00 {
  public version = "0.0";

  public value1: string;

  public constructor(value1: string) {
    this.value1 = value1;
  }

  public static getSaveData(): SaveData00 {
    const elementValue1 = document.getElementById(SavingConstants00.idValue1);
    const value1 = (elementValue1 as HTMLInputElement).value;

    return new SaveData00(value1);
  }

  public static loadSaveData(save: SaveData00): void {
    const elementValue1 = document.getElementById(SavingConstants00.idValue1);
    (elementValue1 as HTMLInputElement).value = save.value1;
  }
}
