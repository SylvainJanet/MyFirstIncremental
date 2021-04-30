import { SaveDataStatic0_0_2 } from "./SaveData0_0_2";
import { getSavingSystem0_0 } from "./../_factories/SavingSystem0_0Factory";
import type { ISavingSystem0_0 } from "./../_interfaces/ISavingSystem0_0";
import { SavingConstants0_0_2 } from "./SavingConstants0_0_2";
import { SavingVersion } from "../../../SavingVersion";
import { SaveConverter0_0_2 } from "./SaveConverter0_0_2";
import type { ISaveDataInstance0_0 } from "../_interfaces/ISaveData0_0";
import { LogService } from "../../../../log/logService";

export const SavingSystem0_0_2: ISavingSystem0_0 = getSavingSystem0_0(
  SaveDataStatic0_0_2,
  SavingConstants0_0_2,
  SavingVersion["0.0.2"],
  SaveConverter0_0_2,
  (save: ISaveDataInstance0_0): string => {
    LogService.addLevel("SavingSystem0_0_0.encryptAndFormatSave");
    const result = JSON.stringify(save);
    LogService.removeLevelResultPrimitive(result);
    return result;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (file: string): any => {
    LogService.addLevel("SavingSystem0_0_0.unformatAndDecryptSave");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = JSON.parse(file);
    LogService.removeLevelResultObject(result);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result;
  }
);
