import type { ISaveDataInstance00 } from "../_interfaces/ISaveData00";
import type { ISaveConverter00 } from "../_interfaces/ISaveConverter00";
import { SavingVersion } from "../../../SavingVersion";

export const SaveConverter000: ISaveConverter00 = {
  version: SavingVersion["0.0.0"],
  convert(save: ISaveDataInstance00): ISaveDataInstance00 {
    console.log("useless : no previous version to convert from");
    return save;
  },
  convertBack(save: ISaveDataInstance00): ISaveDataInstance00 {
    console.log("useless: no previous version to convert to");
    return save;
  },
};
