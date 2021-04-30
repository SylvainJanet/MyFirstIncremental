import { ErrorMessages } from "./../../../../exceptions/errorMessages";
import { ErrorCode } from "./../../../../exceptions/errorCode";
import type { ISaveDataInstance0_0 } from "./../_interfaces/ISaveData0_0";
import { SavingVersion } from "../../../SavingVersion";
import { SaveConverter0_0_1 } from "../0.0.1/SaveConverter0_0_1";
import { getSaveConverter0_0 } from "../_factories/SaveConverter0_0Factory";
import { TypeHelperSavingSystem0_0 } from "../_helpers/TypeHelperSavingSystem0_0";
import type { ISaveConverter0_0 } from "../_interfaces/ISaveConverter0_0";
import { LogService } from "../../../../log/logService";
import { ErrorCustom } from "../../../../exceptions/errorCustom";
import { ErrorType } from "../../../../exceptions/errorType";

export const SaveConverter0_0_2: ISaveConverter0_0 = getSaveConverter0_0(
  TypeHelperSavingSystem0_0,
  SavingVersion["0.0.2"],
  SaveConverter0_0_1,
  null,
  (save: ISaveDataInstance0_0) => {
    LogService.addLevel("SaveConverter0_0_2.actualConversionFromPrevious");
    const error = new ErrorCustom(
      ErrorType.SaveIntegrity,
      ErrorCode.SAVECONVERTER_CONVERTBACK_ISLASTVERSION,
      ErrorMessages.SAVECONVERTER_CONVERTBACK_ISLASTVERSION(save, SavingVersion["0.0.2"])
    );
    LogService.removeLevelError(error);
    throw error;
  },
  (save: ISaveDataInstance0_0) => {
    LogService.addLevel("SaveConverter0_0_2.actualConversionFromPrevious");
    save.version += 1;
    LogService.removeLevelResultObject(save);
    return save;
  }
);
