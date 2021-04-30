import type { ISaveDataInstance0_0 } from "./../_interfaces/ISaveData0_0";
import type { ISaveConverter0_0 } from "./../_interfaces/ISaveConverter0_0";
import { SavingVersion } from "../../../SavingVersion";
import { SaveConverter0_0_1 } from "../0.0.1/SaveConverter0_0_1";
import { TypeHelperSavingSystem0_0 } from "../_helpers/TypeHelperSavingSystem0_0";
import { getSaveConverter0_0 } from "../_factories/SaveConverter0_0Factory";

export const SaveConverter0_0_0: ISaveConverter0_0 = getSaveConverter0_0(
  TypeHelperSavingSystem0_0,
  SavingVersion["0.0.0"],
  null,
  SaveConverter0_0_1,
  (save: ISaveDataInstance0_0) => {
    save.version -= 1;
    return save;
  },
  (save: ISaveDataInstance0_0) => {
    save.version += 1;
    return save;
  }
);
