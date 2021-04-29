import type { ISavingSystem0_0 } from "./../_interfaces/ISavingSystem0_0";
import { getSavingSystem0_0 } from "./../_factories/SavingSystem0_0Factory";
import { SaveDataStatic0_0_1 } from "./SaveData0_0_1";
import { SavingVersion } from "../../../SavingVersion";
import { SaveConverter0_0_1 } from "./SaveConverter0_0_1";
import { SavingConstants0_0_1 } from "./SavingConstants0_0_1";

export const SavingSystem0_0_1: ISavingSystem0_0 = getSavingSystem0_0(
  SaveDataStatic0_0_1,
  SavingConstants0_0_1,
  SavingVersion["0.0.1"],
  SaveConverter0_0_1
);
