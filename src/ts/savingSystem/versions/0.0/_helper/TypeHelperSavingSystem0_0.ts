import { Log } from "./../../../../log/config";
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { isSaveVersioned } from "../../../interfaces/ISaveVersioned";
import type { ISaveDataInstance0_0 } from "../_interfaces/ISaveData0_0";
import type { ITypeHelperSavingSystem } from "./../../../interfaces/ITypeHelperSavingSystem";
import { LogLevel } from "typescript-logging";

export const TypeHelperSavingSystem0_0: ITypeHelperSavingSystem<ISaveDataInstance0_0> = {
  isSaveData(object: any): object is ISaveDataInstance0_0 {
    Log.log(LogLevel.Trace, "***** isSaveData *****", null);
    Log.log(LogLevel.Trace, "Object is being type checked : ISaveDataInstance0_0 ?", null);
    Log.log(LogLevel.Trace, JSON.stringify(object), null);
    const result = isSaveVersioned(object) && typeof (object as any).value1 === "string";
    Log.log(LogLevel.Trace, `===== result isSaveData : ${String(result)}`, null);
    return result;
  },
  getSaveData(object: any): ISaveDataInstance0_0 {
    Log.log(LogLevel.Trace, "***** getSaveData *****", null);
    if (this.isSaveData(object)) {
      Log.log(LogLevel.Trace, "===== end getSaveData : object is SaveData", null);
      return object;
    }
    Log.log(LogLevel.Error, "===== end getSaveData : object is not save data", Error("object is not save data"));
    throw new Error("object is not save data");
  },
};
