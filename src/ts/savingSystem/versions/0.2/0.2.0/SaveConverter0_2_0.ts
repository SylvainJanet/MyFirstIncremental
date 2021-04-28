import type { ISaveDataInstance0_2 } from "../_interfaces/ISaveData0_2";
import type { ISaveConverter0_2 } from "../_interfaces/ISaveConverter0_2";
import { SavingVersion } from "../../../SavingVersion";

export const SaveConverter0_2_0: ISaveConverter0_2 = {
  version: SavingVersion["0.2.0"],
  convert(save: ISaveDataInstance0_2): ISaveDataInstance0_2 {
    // TODO
    return save;
  },
  convertBack(save: ISaveDataInstance0_2): ISaveDataInstance0_2 {
    // TODO
    return save;
  },
};
