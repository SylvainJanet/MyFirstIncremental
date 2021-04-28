import type { ISaveDataInstance1_0 } from "../_interfaces/ISaveData1_0";
import type { ISaveConverter1_0 } from "../_interfaces/ISaveConverter1_0";
import { SavingVersion } from "../../../SavingVersion";

export const SaveConverter1_0_0: ISaveConverter1_0 = {
  version: SavingVersion["1.0.0"],
  convert(save: ISaveDataInstance1_0): ISaveDataInstance1_0 {
    // TODO
    return save;
  },
  convertBack(save: ISaveDataInstance1_0): ISaveDataInstance1_0 {
    // TODO
    return save;
  },
};
