import { SavingVersion } from "../../../SavingVersion";
import { SaveConverter001 } from "../0.0.1/SaveConverter001";
import type { ISaveConverter00 } from "../_interfaces/ISaveConverter00";
import type { ISaveDataInstance00 } from "../_interfaces/ISaveData00";

const previousSaveConverter = SaveConverter001;

export const SaveConverter002: ISaveConverter00 = {
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
    const modifiedSave = save;
    if (modifiedSave.version <= this.version) {
      console.log("error : trying to convert older version");
      return modifiedSave;
    }
    if (modifiedSave.version > this.version + 1) {
      console.log("error : version doesn't exist");
    }
    if (modifiedSave.version === this.version + 1) {
      console.log("error : version doesn't exist");
    }
    return modifiedSave;
  },
};
