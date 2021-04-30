import { SaveDataStatic0_0_0 } from "./SaveData0_0_0";
import { getSavingSystem0_0 } from "./../_factories/SavingSystem0_0Factory";
import type { ISavingSystem0_0 } from "./../_interfaces/ISavingSystem0_0";
import { SavingConstants0_0_0 } from "./SavingConstants0_0_0";
import { SavingVersion } from "../../../SavingVersion";
import { SaveConverter0_0_0 } from "./SaveConverter0_0_0";

export const SavingSystem0_0_0: ISavingSystem0_0 = getSavingSystem0_0(
  SaveDataStatic0_0_0,
  SavingConstants0_0_0,
  SavingVersion["0.0.0"],
  SaveConverter0_0_0
);
