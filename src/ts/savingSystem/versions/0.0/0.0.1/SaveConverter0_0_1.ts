import type { ISaveDataInstance0_1 } from "./../../0.1/_interfaces/ISaveData0_1";
import { ErrorCode } from "./../../../../exceptions/errorCode";
import { ErrorCustom } from "./../../../../exceptions/errorCustom";
import type { ISaveVersioned } from "./../../../interfaces/ISaveVersioned";
import { TypeHelperSavingSystem0_0 } from "./../_helper/TypeHelperSavingSystem0_0";
import type { ISaveDataInstance0_0 } from "../_interfaces/ISaveData0_0";
import type { ISaveConverter0_0 } from "../_interfaces/ISaveConverter0_0";
import { SavingVersion } from "../../../SavingVersion";
import { SaveConverter0_0_0 } from "../0.0.0/SaveConverter0_0_0";
import { SaveConverter0_0_2 } from "../0.0.2/SaveConverter0_0_2";
import { ErrorType } from "../../../../exceptions/errorType";
import { ErrorMessages } from "../../../../exceptions/errorMessages";

export const SaveConverter0_0_1: ISaveConverter0_0 = {
  typeHelper: TypeHelperSavingSystem0_0,
  version: SavingVersion["0.0.1"],
  previousSaveConverter: SaveConverter0_0_0,
  nextSaveConverter: SaveConverter0_0_2,
  convert(save: ISaveVersioned): ISaveDataInstance0_0 {
    if (save.version === this.version) {
      throw new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_USELESS_0_0_1,
        ErrorMessages.SAVECONVERTER_USELESS(save, this.version)
      );
    }
    if (save.version < this.version) {
      return this.convertForward(save);
    }
    return this.convertBack(save);
  },
  convertForward(save: ISaveVersioned): ISaveDataInstance0_0 {
    throw new ErrorCustom(
      ErrorType.SaveIntegrity,
      ErrorCode.SAVECONVERTER_VERSION_BEFORE_INIT,
      ErrorMessages.SAVECONVERTER_VERSION_INCORRECT(save)
    );
  },
  // eslint-disable-next-line max-statements
  convertBack(save: ISaveVersioned): ISaveDataInstance0_0 {
    let modifiedSave = save;
    if (modifiedSave.version > this.version + 1) {
      if (this.nextSaveConverter === null) {
        throw new ErrorCustom(
          ErrorType.SaveIntegrity,
          ErrorCode.SAVECONVERTER_CONVERTBACK_ISLASTVERSION_0_0_1,
          ErrorMessages.SAVECONVERTER_CONVERTBACK_ISLASTVERSION(modifiedSave, this.version)
        );
      } else {
        modifiedSave = this.nextSaveConverter.convert(modifiedSave as ISaveDataInstance0_1);
      }
    }
    if (modifiedSave.version === this.version + 1) {
      modifiedSave = this.convertBackFromNext(modifiedSave);
    } else {
      throw new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTBACK_VERSIONERROR_0_0_1,
        ErrorMessages.SAVECONVERTER_CONVERTBACK_VERSIONERROR(save, this.version)
      );
    }
    if (modifiedSave.version === this.version) {
      return modifiedSave as ISaveDataInstance0_0;
    }
    throw new ErrorCustom(
      ErrorType.SaveIntegrity,
      ErrorCode.SAVECONVERTER_CONVERTBACK_VERSIONCONVERSIONERROR_0_0_1,
      ErrorMessages.SAVECONVERTER_CONVERTBACK_VERSIONCONVERSIONERROR(modifiedSave, this.version)
    );
  },
  convertBackFromNext(save: ISaveVersioned): ISaveDataInstance0_0 {
    if (save.version !== this.version + 1) {
      throw new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTBACKFROMNEXT_0_0_1,
        ErrorMessages.SAVECONVERTER_CONVERTBACKFROMNEXT(save, this.version + 1)
      );
    }
    save.version = this.version;
    return save as ISaveDataInstance0_0;
  },
  convertForwardFromPrevious(save: ISaveVersioned): ISaveDataInstance0_0 {
    if (save.version !== this.version - 1) {
      throw new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTFORWARDFROMPREVIOUS_0_0_1,
        ErrorMessages.SAVECONVERTER_CONVERTFORWARDFROMPREVIOUS(save, this.version - 1)
      );
    }
    save.version = this.version;
    return save as ISaveDataInstance0_0;
  },
};
