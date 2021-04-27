import { SavingVersion } from "../../../SavingVersion";
import type { ISaveDataInstance01 } from "../_interfaces/ISaveData01";
import type { ISaveConverter01 } from "./../_interfaces/ISaveConverter01";
export const SaveConverter010: ISaveConverter01 = {
  version: SavingVersion["0.1.0"],
  convert(save: ISaveDataInstance01): ISaveDataInstance01 {
    // TODO
    return save;
  },
  convertBack(save: ISaveDataInstance01): ISaveDataInstance01 {
    // TODO
    return save;
  },
};
