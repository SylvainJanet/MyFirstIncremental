import type { ISaveVersioned } from "../../../interfaces/ISaveVersioned";
import type { ISaveDataInstance0_2 } from "./ISaveData0_2";
export interface ISaveConverter0_2 extends ISaveVersioned {
  convert: (save: ISaveDataInstance0_2) => ISaveDataInstance0_2;
  convertBack: (save: ISaveDataInstance0_2) => ISaveDataInstance0_2;
}
