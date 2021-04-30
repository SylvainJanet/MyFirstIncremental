import { ErrorCode } from "./../../../../exceptions/errorCode";
import { ErrorType } from "./../../../../exceptions/errorType";
import { ErrorCustom } from "./../../../../exceptions/errorCustom";
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { isSaveVersioned } from "../../../interfaces/ISaveVersioned";
import type { ISaveDataInstance0_0 } from "../_interfaces/ISaveData0_0";
import type { ITypeHelperSavingSystem } from "../../../interfaces/ITypeHelperSavingSystem";
import { LogLevel } from "typescript-logging";
import { ErrorMessages } from "../../../../exceptions/errorMessages";
import { LogService } from "../../../../log/logService";

export const TypeHelperSavingSystem0_0: ITypeHelperSavingSystem<ISaveDataInstance0_0> = {
  isSaveData(object: any): object is ISaveDataInstance0_0 {
    LogService.addLevel("TypeHelperSavingSystem0_0.isSaveData");
    LogService.log(LogLevel.Trace, "Object is being type checked : ISaveDataInstance0_0 ?", null);
    LogService.log(LogLevel.Trace, JSON.stringify(object), null);
    const result = isSaveVersioned(object) && typeof (object as any).value1 === "string";
    LogService.removeLevelResultPrimitive(result);
    return result;
  },
  getSaveData(object: any): ISaveDataInstance0_0 {
    LogService.addLevel("TypeHelperSavingSystem0_0.getSaveData");
    LogService.log(LogLevel.Trace, "Object is being casted to : ISaveDataInstance0_0", null);
    LogService.log(LogLevel.Trace, JSON.stringify(object), null);
    if (this.isSaveData(object)) {
      LogService.log(LogLevel.Trace, "object is SaveData", null);
      LogService.removeLevelResultObject(object);
      return object;
    }
    const error = new ErrorCustom(
      ErrorType.SaveIntegrity,
      ErrorCode.TYPEHELPERSAVINGSYSTEM_GETSAVEDATA_NOTSAVEDATAINSTANCE_0_0,
      ErrorMessages.TYPEHELPERSAVINGSYSTEM_GETSAVEDATA_NOTSAVEDATAINSTANCE(object)
    );
    LogService.removeLevelError(error);
    throw error;
  },
};
