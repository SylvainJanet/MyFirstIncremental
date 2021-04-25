import type { SaveData00 } from "./../0.0/SaveData00";
import { SaveData001 } from "./SaveData001";

export const SaveConverter001 = {
  convert(save: SaveData00): SaveData001 {
    return new SaveData001(save.value1, "no value found (conversion done)");
  },
};
