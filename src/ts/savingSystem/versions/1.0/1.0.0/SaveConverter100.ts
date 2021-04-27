import type { ISaveDataInstance10 } from "../_interfaces/ISaveData10";
import type { ISaveConverter10 } from "../_interfaces/ISaveConverter10";
import { SavingVersion } from "../../../SavingVersion";

export const SaveConverter100: ISaveConverter10 = {
  version: SavingVersion["1.0.0"],
  convert(save: ISaveDataInstance10): ISaveDataInstance10 {
    // TODO
    return save;
  },
  convertBack(save: ISaveDataInstance10): ISaveDataInstance10 {
    // TODO
    return save;
  },
};
