import type { ISaveDataInstance0_0 } from "./../_interfaces/ISaveData0_0";
import { SaveDataStatic0_0_0 } from "./SaveData0_0_0";
import { getSavingSystem0_0 } from "./../_factories/SavingSystem0_0Factory";
import type { ISavingSystem0_0 } from "./../_interfaces/ISavingSystem0_0";
import { SavingConstants0_0_0 } from "./SavingConstants0_0_0";
import { getSavingVersionDisplay, getSavingVersionNbr, SavingVersion } from "../../../SavingVersion";
import { SaveConverter0_0_0 } from "./SaveConverter0_0_0";
import { LogService } from "../../../../log/logService";
import type { ISaveCrypted } from "../_interfaces/ISaveCrypted";
import { getSaveCrypted } from "../_interfaces/ISaveCrypted";

export const SavingSystem0_0_0: ISavingSystem0_0 = getSavingSystem0_0(
  SaveDataStatic0_0_0,
  SavingConstants0_0_0,
  SavingVersion["0.0.0"],
  SaveConverter0_0_0,
  (save: ISaveDataInstance0_0): string => {
    LogService.addLevel("SavingSystem0_0_0.encryptAndFormatSave");
    const modifiedSave = getSaveCrypted(getSavingVersionDisplay(save.version), save.value1);
    const result = JSON.stringify(modifiedSave);
    LogService.removeLevelResultPrimitive(result);
    return result;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (file: string): any => {
    LogService.addLevel("SavingSystem0_0_0.unformatAndDecryptSave");
    const save = JSON.parse(file) as ISaveCrypted;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const result = save as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    result.version = getSavingVersionNbr(result.version);
    LogService.removeLevelResultObject(result);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result;
  }
);
