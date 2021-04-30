import { LogService } from "../../../../log/logService";
import { SavingVersion } from "../../../SavingVersion";
import { getSaveDataInstance0_0, getSaveDataStatic0_0 } from "../_factories/SaveData0_0Factory";
import { SavingConstants0_0_1 } from "./SavingConstants0_0_1";

export const SaveDataInstance0_0_1 = getSaveDataInstance0_0(
  SavingVersion["0.0.1"],
  SavingConstants0_0_1,
  (value1: string) => {
    LogService.addLevel("SaveDataInstance0_0_1.changeValueBeforeSave");
    LogService.removeLevelResultPrimitive(value1);
    return value1;
  },
  (value1: string) => {
    LogService.addLevel("SaveDataInstance0_0_1.changeBackValueAfterLoad");
    LogService.removeLevelResultPrimitive(value1);
    return value1;
  }
);
export const SaveDataStatic0_0_1 = getSaveDataStatic0_0(SaveDataInstance0_0_1);
