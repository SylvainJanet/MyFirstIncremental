import { getSaveDataInstance0_0, getSaveDataStatic0_0 } from "./../_factories/SaveData0_0Factory";
import { SavingConstants0_0_0 } from "./SavingConstants0_0_0";
import { SavingVersion } from "../../../SavingVersion";
import { LogService } from "../../../../log/logService";

export const SaveDataInstance0_0_0 = getSaveDataInstance0_0(
  SavingVersion["0.0.0"],
  SavingConstants0_0_0,
  (value1: string) => {
    LogService.addLevel("SaveDataInstance0_0_0.changeValueBeforeSave");
    LogService.removeLevelResultPrimitive(value1);
    return value1;
  },
  (value1: string) => {
    LogService.addLevel("SaveDataInstance0_0_0.changeBackValueAfterLoad");
    LogService.removeLevelResultPrimitive(value1);
    return value1;
  }
);
export const SaveDataStatic0_0_0 = getSaveDataStatic0_0(SaveDataInstance0_0_0);
