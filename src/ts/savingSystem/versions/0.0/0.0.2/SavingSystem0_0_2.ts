import { SaveDataStatic0_0_2 } from "./SaveData0_0_2";
import { getSavingSystem0_0 } from "./../_factories/SavingSystem0_0Factory";
import type { ISavingSystem0_0 } from "./../_interfaces/ISavingSystem0_0";
import { SavingConstants0_0_2 } from "./SavingConstants0_0_2";
import { SavingVersion } from "../../../SavingVersion";
import { SaveConverter0_0_2 } from "./SaveConverter0_0_2";

export const SavingSystem0_0_2: ISavingSystem0_0 = getSavingSystem0_0(
  SaveDataStatic0_0_2,
  SavingConstants0_0_2,
  SavingVersion["0.0.2"],
  SaveConverter0_0_2
);
