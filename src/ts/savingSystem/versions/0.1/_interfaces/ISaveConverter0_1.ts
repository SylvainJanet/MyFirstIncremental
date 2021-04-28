import type { ISaveVersioned } from "../../../interfaces/ISaveVersioned";
import type { ISaveDataInstance0_1 } from "./ISaveData0_1";
export interface ISaveConverter0_1 extends ISaveVersioned {
  convert: (save: ISaveDataInstance0_1) => ISaveDataInstance0_1;
  convertBack: (save: ISaveDataInstance0_1) => ISaveDataInstance0_1;
}
