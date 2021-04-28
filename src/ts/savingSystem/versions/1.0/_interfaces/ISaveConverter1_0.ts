import type { ISaveVersioned } from "../../../interfaces/ISaveVersioned";
import type { ISaveDataInstance1_0 } from "./ISaveData1_0";
export interface ISaveConverter1_0 extends ISaveVersioned {
  convert: (save: ISaveDataInstance1_0) => ISaveDataInstance1_0;
  convertBack: (save: ISaveDataInstance1_0) => ISaveDataInstance1_0;
}
