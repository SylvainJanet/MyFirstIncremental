import { SaveConverter001 } from "../0.0.1/SaveConverter001";
import type { SaveData00 } from "../0.0/SaveData00";
import type { SaveData001 } from "./../0.0.1/SaveData001";
import { SaveData002 } from "./SaveData002";

export const SaveConverter002 = {
  convert00(save: SaveData00): SaveData002 {
    return this.convert001(SaveConverter001.convert(save));
  },
  convert001(save: SaveData001): SaveData002 {
    return new SaveData002(save.value1, save.value2, "no value found (conversion done)");
  },
};
