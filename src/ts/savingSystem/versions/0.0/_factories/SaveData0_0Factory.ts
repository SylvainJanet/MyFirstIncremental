/* eslint-disable max-classes-per-file */
import type { ISavingConstants0_0 } from "./../_interfaces/ISavingConstants0_0";
import { LogLevel } from "typescript-logging";
import type { ISaveDataInstance0_0, ISaveDataStatic0_0 } from "../_interfaces/ISaveData0_0";
import { SavingVersion } from "../../../SavingVersion";
import { LogService } from "../../../../log/logService";

class SaveDataInstance0_0 implements ISaveDataInstance0_0 {
  public version = SavingVersion["0.0.0"];

  public value1: string;

  public constructor(value1: string) {
    this.value1 = value1;
  }

  public static getSaveData(): ISaveDataInstance0_0 {
    return new SaveDataInstance0_0("");
  }

  public static loadSaveData(save: ISaveDataInstance0_0): void {
    save.version = SavingVersion["0.0.0"];
  }
}

// eslint-disable-next-line max-lines-per-function
export const getSaveDataInstance0_0 = (
  version: SavingVersion,
  savingConstants: ISavingConstants0_0,
  changeValueBeforeSave: (value1: string) => string,
  changeBackValueAfterLoad: (value1: string) => string
): typeof SaveDataInstance0_0 => {
  const ErrorHelper = {
    checkElementIdExists(element: HTMLElement | null): element is HTMLElement {
      LogService.addLevel("checkElementIdExists");
      const result = element !== null;
      LogService.removeLevelResultPrimitive(result);
      return result;
    },
  };

  class SaveDataInstance implements ISaveDataInstance0_0 {
    public version = version;

    public value1: string;

    public constructor(value1: string) {
      LogService.log(LogLevel.Trace, "new instance of SaveDataInstance created", null);
      this.value1 = value1;
    }

    // eslint-disable-next-line max-statements
    public static getSaveData(): ISaveDataInstance0_0 {
      LogService.addLevel("SaveDataInstance.getSaveData");
      LogService.log(LogLevel.Trace, `get element with id ${savingConstants.idValue1}`, null);
      const elementValue1 = document.getElementById(savingConstants.idValue1);
      if (ErrorHelper.checkElementIdExists(elementValue1)) {
        LogService.log(LogLevel.Trace, `element with id ${savingConstants.idValue1} found`, null);
        const value1 = (elementValue1 as HTMLInputElement).value;
        LogService.log(LogLevel.Trace, `value read : ${value1}`, null);
        const result = new SaveDataInstance(changeValueBeforeSave(value1));
        LogService.removeLevelResultObject(result);
        return result;
      }
      LogService.log(LogLevel.Trace, `element with id ${savingConstants.idValue1} not found. Using default value instead`, null);
      const result = new SaveDataInstance(savingConstants.value1Default);
      LogService.removeLevelResultObject(result);
      return result;
    }

    // eslint-disable-next-line max-statements
    public static loadSaveData(save: ISaveDataInstance0_0): void {
      LogService.addLevel("SaveDataInstance.loadSaveData");
      LogService.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
      LogService.log(LogLevel.Trace, `get element with id ${savingConstants.idValue1}`, null);
      const elementValue1 = document.getElementById(savingConstants.idValue1);
      if (ErrorHelper.checkElementIdExists(elementValue1)) {
        LogService.log(LogLevel.Trace, `element with id ${savingConstants.idValue1} found`, null);
        (elementValue1 as HTMLInputElement).value = changeBackValueAfterLoad(save.value1);
        LogService.log(LogLevel.Trace, `value put : ${save.value1}`, null);
        LogService.removeLevelVoid();
        return;
      }
      LogService.log(LogLevel.Trace, `element with id ${savingConstants.idValue1} not found`, null);
      LogService.removeLevelVoid();
    }
  }
  return SaveDataInstance;
};

export const getSaveDataStatic0_0 = (saveDataInstance: typeof SaveDataInstance0_0): ISaveDataStatic0_0 => saveDataInstance;
