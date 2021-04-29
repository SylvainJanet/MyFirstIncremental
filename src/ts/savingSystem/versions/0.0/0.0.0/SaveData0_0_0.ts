import { LogLevel } from "typescript-logging";
/* eslint-disable max-classes-per-file */
import type { ISaveDataInstance0_0, ISaveDataStatic0_0 } from "../_interfaces/ISaveData0_0";
import { SavingConstants0_0_0 } from "./SavingConstants0_0_0";
import { SavingVersion } from "../../../SavingVersion";
import { Log } from "../../../../log/config";

const ErrorHelper = {
  checkElementIdExists(element: HTMLElement | null): element is HTMLElement {
    Log.log(LogLevel.Debug, "***** checkElementIdExists *****", null);
    if (element === null) {
      const result = false;
      Log.log(LogLevel.Debug, `===== result checkElementIdExists : ${String(result)}`, null);
      return result;
    }
    const result = true;
    Log.log(LogLevel.Debug, `===== result checkElementIdExists : ${String(result)}`, null);
    return result;
  },
};

export class SaveDataInstance0_0_0 implements ISaveDataInstance0_0 {
  public version = SavingVersion["0.0.0"];

  public value1: string;

  public constructor(value1: string) {
    Log.log(LogLevel.Trace, "new instance of SaveDataInstance0_0_0 created", null);
    this.value1 = value1;
  }

  // eslint-disable-next-line max-statements
  public static getSaveData(): ISaveDataInstance0_0 {
    Log.log(LogLevel.Debug, "***** getSaveData *****", null);
    Log.log(LogLevel.Trace, `get element with id ${SavingConstants0_0_0.idValue1}`, null);
    const elementValue1 = document.getElementById(SavingConstants0_0_0.idValue1);
    if (ErrorHelper.checkElementIdExists(elementValue1)) {
      Log.log(LogLevel.Trace, `element with id ${SavingConstants0_0_0.idValue1} found`, null);
      const value1 = (elementValue1 as HTMLInputElement).value;
      Log.log(LogLevel.Trace, `value read : ${value1}`, null);
      const result = new SaveDataInstance0_0_0(value1);
      Log.log(LogLevel.Debug, `===== result getSaveData : ${JSON.stringify(result)}`, null);
      return result;
    }
    Log.log(LogLevel.Trace, `element with id ${SavingConstants0_0_0.idValue1} not found. Using default value instead`, null);
    const result = new SaveDataInstance0_0_0(SavingConstants0_0_0.value1Default);
    Log.log(LogLevel.Debug, `===== result getSaveData : ${JSON.stringify(result)}`, null);
    return result;
  }

  // eslint-disable-next-line max-statements
  public static loadSaveData(save: ISaveDataInstance0_0): void {
    Log.log(LogLevel.Debug, "***** loadSaveData *****", null);
    Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    Log.log(LogLevel.Trace, `get element with id ${SavingConstants0_0_0.idValue1}`, null);
    const elementValue1 = document.getElementById(SavingConstants0_0_0.idValue1);
    if (ErrorHelper.checkElementIdExists(elementValue1)) {
      Log.log(LogLevel.Trace, `element with id ${SavingConstants0_0_0.idValue1} found`, null);
      (elementValue1 as HTMLInputElement).value = save.value1;
      Log.log(LogLevel.Trace, `value put : ${save.value1}`, null);
      Log.log(LogLevel.Debug, `===== end loadSaveData : OK`, null);
      return;
    }
    Log.log(LogLevel.Trace, `element with id ${SavingConstants0_0_0.idValue1} not found`, null);
    Log.log(LogLevel.Debug, "===== end loadSaveData : OK ", null);
  }
}
export const SaveDataStatic0_0_0: ISaveDataStatic0_0 = SaveDataInstance0_0_0;
