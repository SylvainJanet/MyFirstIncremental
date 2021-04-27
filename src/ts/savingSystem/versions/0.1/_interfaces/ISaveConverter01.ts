import type { SavingVersion } from "../../../SavingVersion";
import type { ISaveDataInstance01 } from "./ISaveData01";
export interface ISaveConverter01 {
  version: SavingVersion;
  convert: (save: ISaveDataInstance01) => ISaveDataInstance01;
  convertBack: (save: ISaveDataInstance01) => ISaveDataInstance01;
}
