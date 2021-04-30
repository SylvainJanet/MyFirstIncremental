import { SaveConverter0_0_0 } from "./../0.0.0/SaveConverter0_0_0";
import type { ISaveDataInstance0_0 } from "../_interfaces/ISaveData0_0";
import type { ISaveConverter0_0 } from "../_interfaces/ISaveConverter0_0";
import { SavingVersion } from "../../../SavingVersion";
import { TypeHelperSavingSystem0_0 } from "../_helpers/TypeHelperSavingSystem0_0";
import { getSaveConverter0_0 } from "../_factories/SaveConverter0_0Factory";
import { SaveConverter0_0_2 } from "../0.0.2/SaveConverter0_0_2";
import { LogService } from "../../../../log/logService";

export const SaveConverter0_0_1: ISaveConverter0_0 = getSaveConverter0_0(
  TypeHelperSavingSystem0_0,
  SavingVersion["0.0.1"],
  SaveConverter0_0_0,
  SaveConverter0_0_2,
  (save: ISaveDataInstance0_0) => {
    LogService.addLevel("SaveConverter0_0_1.actualConversionFromNext");
    save.version -= 1;
    LogService.removeLevelResultObject(save);
    return save;
  },
  (save: ISaveDataInstance0_0) => {
    LogService.addLevel("SaveConverter0_0_1.actualConversionFromPrevious");
    save.version += 1;
    LogService.removeLevelResultObject(save);
    return save;
  }
);
