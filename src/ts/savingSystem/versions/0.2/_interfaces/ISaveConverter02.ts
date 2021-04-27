import type { SavingVersion } from "../../../SavingVersion";
import type { ISaveDataInstance02 } from "./ISaveData02";
export interface ISaveConverter02 {
  version: SavingVersion;
  convert: (save: ISaveDataInstance02) => ISaveDataInstance02;
  convertBack: (save: ISaveDataInstance02) => ISaveDataInstance02;
}
