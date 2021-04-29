import type { ITypeHelperSavingSystem } from "./../../../interfaces/ITypeHelperSavingSystem";
import type { ISaveVersioned } from "../../../interfaces/ISaveVersioned";
import type { ISaveDataInstance0_0 } from "./ISaveData0_0";
export interface ISaveConverter0_0 extends ISaveVersioned {
  typeHelper: ITypeHelperSavingSystem<ISaveDataInstance0_0>;
  previousSaveConverter: ISaveConverter0_0 | null;
  nextSaveConverter: ISaveConverter0_0 | null;
  convert: (save: ISaveVersioned) => ISaveDataInstance0_0;
  convertForward: (save: ISaveVersioned) => ISaveDataInstance0_0;
  convertBack: (save: ISaveVersioned) => ISaveDataInstance0_0;
  convertBackFromNext: (save: ISaveVersioned) => ISaveDataInstance0_0;
  convertForwardFromPrevious: (save: ISaveVersioned) => ISaveDataInstance0_0;
}
