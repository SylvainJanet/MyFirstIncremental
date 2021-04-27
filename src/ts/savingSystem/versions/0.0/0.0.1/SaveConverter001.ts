import type { ISaveDataInstance00 } from "../_interfaces/ISaveData00";
import type { ISaveConverter00 } from "../_interfaces/ISaveConverter00";
import { SavingVersion } from "../../../SavingVersion";
import { SaveConverter000 } from "../0.0.0/SaveConverter000";
import { SaveConverter002 } from "../0.0.2/SaveConverter002";

const previousSaveConverter = SaveConverter000;
const nextSaveConverter = SaveConverter002;

export const SaveConverter001: ISaveConverter00 = {
  version: SavingVersion["0.0.1"],
  convert(save: ISaveDataInstance00): ISaveDataInstance00 {
    let modifiedSave = save;
    if (modifiedSave.version >= this.version) {
      console.log("error : trying to convert newer version");
      return modifiedSave;
    }
    if (modifiedSave.version < this.version - 1) {
      modifiedSave = previousSaveConverter.convert(modifiedSave);
    }
    if (modifiedSave.version === this.version - 1) {
      console.log("conversion done from 0.0.0 to 0.0.1");
      modifiedSave.version = this.version;
    }
    return modifiedSave;
  },
  convertBack(save: ISaveDataInstance00): ISaveDataInstance00 {
    let modifiedSave = save;
    if (modifiedSave.version <= this.version) {
      console.log("error : trying to convert older version");
      return modifiedSave;
    }
    if (modifiedSave.version > this.version + 1) {
      modifiedSave = nextSaveConverter.convert(modifiedSave);
    }
    if (modifiedSave.version === this.version + 1) {
      console.log("conversion done from 0.0.2 to 0.0.1");
      modifiedSave.version = this.version;
    }
    return modifiedSave;
  },
};
