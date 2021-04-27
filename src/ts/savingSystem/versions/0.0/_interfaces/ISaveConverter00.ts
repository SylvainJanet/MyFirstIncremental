import type { SavingVersion } from "../../../SavingVersion";
import type { ISaveDataInstance00 } from "./ISaveData00";
export interface ISaveConverter00 {
  version: SavingVersion;
  convert: (save: ISaveDataInstance00) => ISaveDataInstance00;
  convertBack: (save: ISaveDataInstance00) => ISaveDataInstance00;
}
