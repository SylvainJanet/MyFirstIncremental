import { ErrorCode } from "./../../../../exceptions/errorCode";
import type { ISaveDataInstance0_0 } from "./../_interfaces/ISaveData0_0";
import type { ISaveConverter0_0 } from "./../_interfaces/ISaveConverter0_0";
import { SavingVersion } from "../../../SavingVersion";
import { SaveConverter0_0_1 } from "../0.0.1/SaveConverter0_0_1";
import { TypeHelperSavingSystem0_0 } from "../_helpers/TypeHelperSavingSystem0_0";
import { getSaveConverter0_0 } from "../_factories/SaveConverter0_0Factory";
import { ErrorCustom } from "../../../../exceptions/errorCustom";
import { ErrorType } from "../../../../exceptions/errorType";
import { ErrorMessages } from "../../../../exceptions/errorMessages";
import { LogService } from "../../../../log/logService";

export const SaveConverter0_0_0: ISaveConverter0_0 = getSaveConverter0_0(
  TypeHelperSavingSystem0_0,
  SavingVersion["0.0.0"],
  null,
  SaveConverter0_0_1,
  (save: ISaveDataInstance0_0) => {
    LogService.addLevel("SaveConverter0_0_0.actualConversionFromNext");
    save.version -= 1;
    LogService.removeLevelResultObject(save);
    return save;
  },
  (save: ISaveDataInstance0_0) => {
    LogService.addLevel("SaveConverter0_0_0.actualConversionFromPrevious");
    const error = new ErrorCustom(
      ErrorType.SaveIntegrity,
      ErrorCode.SAVECONVERTER_CONVERTFORWARD_ISFIRSTVERSION,
      ErrorMessages.SAVECONVERTER_CONVERTFORWARD_ISFIRSTVERSION(save, SavingVersion["0.0.0"])
    );
    LogService.removeLevelError(error);
    throw error;
  }
);
