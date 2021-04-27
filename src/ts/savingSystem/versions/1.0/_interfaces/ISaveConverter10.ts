import type { SavingVersion } from "../../../SavingVersion";
import type { ISaveDataInstance10 } from "./ISaveData10";
export interface ISaveConverter10 {
  version: SavingVersion;
  convert: (save: ISaveDataInstance10) => ISaveDataInstance10;
  convertBack: (save: ISaveDataInstance10) => ISaveDataInstance10;
}
