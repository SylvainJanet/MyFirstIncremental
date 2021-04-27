import type { ISaveDataInstance02 } from "./../_interfaces/ISaveData02";
import type { ISaveConverter02 } from "../_interfaces/ISaveConverter02";
import { SavingVersion } from "../../../SavingVersion";

export const SaveConverter020: ISaveConverter02 = {
  version: SavingVersion["0.2.0"],
  convert(save: ISaveDataInstance02): ISaveDataInstance02 {
    // TODO
    return save;
  },
  convertBack(save: ISaveDataInstance02): ISaveDataInstance02 {
    // TODO
    return save;
  },
};
