import { SavingVersion } from "./../../../SavingVersion";
import { ErrorMessages } from "./../../../../exceptions/errorMessages";
import { ErrorCode } from "./../../../../exceptions/errorCode";
import { TypeHelperSavingSystem0_0 } from "../_helpers/TypeHelperSavingSystem0_0";
import type { ISaveVersioned } from "./../../../interfaces/ISaveVersioned";
import type { ISaveDataInstance0_0 } from "../_interfaces/ISaveData0_0";
import type { ISaveConverter0_0 } from "../_interfaces/ISaveConverter0_0";
import { ErrorCustom } from "../../../../exceptions/errorCustom";
import { ErrorType } from "../../../../exceptions/errorType";
import { SaveConverter0_0_1 } from "../0.0.1/SaveConverter0_0_1";
import { Log } from "../../../../log/config";
import { LogLevel } from "typescript-logging";

const ErrorHelper = {
  checkConvertUseless(save: ISaveVersioned, version: SavingVersion): void {
    Log.log(LogLevel.Debug, "***** checkConvertUseless *****", null);
    Log.log(LogLevel.Trace, "Save is being checked : does it have to be converted ?", null);
    Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    Log.log(LogLevel.Trace, `version : ${version}`, null);
    if (save.version === version) {
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_USELESS_0_0_0,
        ErrorMessages.SAVECONVERTER_USELESS(save, version)
      );
      Log.log(LogLevel.Error, `===== end checkConvertUseless : error`, error);
      throw error;
    }
    Log.log(LogLevel.Debug, `===== end checkConvertUseless : OK`, null);
  },
  checkConvertBackUseless(save: ISaveVersioned, version: SavingVersion): void {
    Log.log(LogLevel.Debug, "***** checkConvertBackUseless *****", null);
    Log.log(LogLevel.Trace, "Save is being checked : does it have to be converted back ?", null);
    Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    Log.log(LogLevel.Trace, `version : ${version}}`, null);
    if (save.version <= version) {
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTBACK_USELESS_0_0_0,
        ErrorMessages.SAVECONVERTER_CONVERTBACK_USELESS(save, version)
      );
      Log.log(LogLevel.Error, `===== end checkConvertBackUseless : error`, error);
      throw error;
    }
    Log.log(LogLevel.Debug, `===== end checkConvertBackUseless : OK`, null);
  },
  // eslint-disable-next-line max-statements
  checkConvertBackNextConverterNull(
    nextSaveConverter: ISaveConverter0_0 | null,
    save: ISaveVersioned,
    version: SavingVersion
  ): nextSaveConverter is ISaveConverter0_0 {
    Log.log(LogLevel.Debug, "***** checkConvertBackNextConverterNull *****", null);
    Log.log(LogLevel.Trace, "Converter is being checked : is it not null ?", null);
    Log.log(LogLevel.Trace, `nextSaveConverter : ${JSON.stringify(nextSaveConverter)}`, null);
    Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    Log.log(LogLevel.Trace, `version : ${version}}`, null);
    if (nextSaveConverter === null) {
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTBACK_ISLASTVERSION_0_0_0,
        ErrorMessages.SAVECONVERTER_CONVERTBACK_ISLASTVERSION(save, version)
      );
      Log.log(LogLevel.Error, `===== end checkConvertBackNextConverterNull : error`, error);
      throw error;
    }
    Log.log(LogLevel.Debug, "===== result checkConvertBackNextConverterNull : true", null);
    return true;
  },
  throwErrorConvertBackVersionError(save: ISaveVersioned, version: SavingVersion): void {
    Log.log(LogLevel.Debug, "***** throwErrorConvertBackVersionError *****", null);
    Log.log(LogLevel.Trace, "Throw error : something went wrong", null);
    Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    Log.log(LogLevel.Trace, `version : ${version}}`, null);
    const error = new ErrorCustom(
      ErrorType.SaveIntegrity,
      ErrorCode.SAVECONVERTER_CONVERTBACK_VERSIONERROR_0_0_0,
      ErrorMessages.SAVECONVERTER_CONVERTBACK_VERSIONERROR(save, version)
    );
    Log.log(LogLevel.Error, `===== end throwErrorConvertBackVersionError : error`, error);
    throw error;
  },
  checkConvertBackFromNextUseless(save: ISaveVersioned, version: SavingVersion): void {
    Log.log(LogLevel.Debug, "***** checkConvertBackFromNextUseless *****", null);
    Log.log(LogLevel.Trace, "Save is being checked : does it have to be converted back ?", null);
    Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    Log.log(LogLevel.Trace, `version : ${version}`, null);
    if (save.version !== version + 1) {
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTBACKFROMNEXT_0_0_0,
        ErrorMessages.SAVECONVERTER_CONVERTBACKFROMNEXT(save, version + 1)
      );
      Log.log(LogLevel.Error, "===== end checkConvertBackFromNextUseless : error", error);
      throw error;
    }
    Log.log(LogLevel.Debug, "===== end checkConvertBackFromNextUseless : OK", null);
  },
  checkConvertForwardFromPreviousUseless(save: ISaveVersioned, version: SavingVersion): void {
    Log.log(LogLevel.Debug, "***** checkConvertForwardFromPreviousUseless *****", null);
    Log.log(LogLevel.Trace, "save is being checked : is it the previous version ?", null);
    Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    Log.log(LogLevel.Trace, `version : ${version}}`, null);
    if (save.version !== version - 1) {
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTFORWARDFROMPREVIOUS_0_0_0,
        ErrorMessages.SAVECONVERTER_CONVERTFORWARDFROMPREVIOUS(save, version - 1)
      );
      Log.log(LogLevel.Error, "===== end checkConvertForwardFromPreviousUseless : error", error);
      throw error;
    }
    Log.log(LogLevel.Debug, "===== end checkConvertForwardFromPreviousUseless : OK", null);
  },
};

export const SaveConverter0_0_0: ISaveConverter0_0 = {
  typeHelper: TypeHelperSavingSystem0_0,
  version: SavingVersion["0.0.0"],
  previousSaveConverter: null,
  nextSaveConverter: SaveConverter0_0_1,
  convert(save: ISaveVersioned): ISaveDataInstance0_0 {
    Log.log(LogLevel.Debug, "***** SaveConverter0_0_0.convert *****", null);
    Log.log(LogLevel.Trace, `save is being converted to version ${this.version}`, null);
    Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    ErrorHelper.checkConvertUseless(save, this.version);
    if (save.version < this.version) {
      Log.log(LogLevel.Debug, "===== end SaveConverter0_0_0.convert : convertForward()", null);
      return this.convertForward(save);
    }
    Log.log(LogLevel.Debug, "===== end SaveConverter0_0_0.convert : convertBack()", null);
    return this.convertBack(save);
  },
  convertForward(save: ISaveVersioned): ISaveDataInstance0_0 {
    Log.log(LogLevel.Debug, "***** SaveConverter0_0_0.convertForward *****", null);
    Log.log(LogLevel.Trace, `old save is being converted forward to version${this.version}`, null);
    Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    const error = new ErrorCustom(
      ErrorType.SaveIntegrity,
      ErrorCode.SAVECONVERTER_VERSION_BEFORE_INIT,
      ErrorMessages.SAVECONVERTER_VERSION_INCORRECT(save)
    );
    Log.log(LogLevel.Error, "===== end SaveConverter0_0_0.convertForward : error", error);
    throw error;
  },

  // eslint-disable-next-line max-statements
  convertBack(save: ISaveVersioned): ISaveDataInstance0_0 {
    Log.log(LogLevel.Debug, "***** SaveConverter0_0_0.convertBack *****", null);
    Log.log(LogLevel.Trace, `newer save is being convert back to version ${this.version}`, null);
    Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    let modifiedSave = save;
    Log.log(LogLevel.Trace, "check : is it useful to convert ?", null);
    ErrorHelper.checkConvertBackUseless(modifiedSave, this.version);
    Log.log(LogLevel.Trace, "check : is save newer than next ?", null);
    if (modifiedSave.version > this.version + 1) {
      Log.log(LogLevel.Trace, "save is newer than next", null);
      Log.log(LogLevel.Trace, "check : does converter exist ?", null);
      if (ErrorHelper.checkConvertBackNextConverterNull(this.nextSaveConverter, modifiedSave, this.version)) {
        Log.log(LogLevel.Trace, "convert save using next converter", null);
        modifiedSave = this.nextSaveConverter.convert(modifiedSave);
      }
    }
    Log.log(LogLevel.Trace, "check : is save next version ?", null);
    if (modifiedSave.version === this.version + 1) {
      Log.log(LogLevel.Trace, "save is next version", null);
      Log.log(LogLevel.Trace, "convert save", null);
      modifiedSave = this.convertBackFromNext(modifiedSave);
    } else {
      ErrorHelper.throwErrorConvertBackVersionError(save, this.version);
    }
    Log.log(LogLevel.Trace, "is save now at the current version ?", null);
    if (modifiedSave.version === this.version) {
      Log.log(LogLevel.Debug, `===== result SaveConverter0_0_0.convertBack : ${JSON.stringify(modifiedSave)}`, null);
      return modifiedSave as ISaveDataInstance0_0;
    }
    const error = new ErrorCustom(
      ErrorType.SaveIntegrity,
      ErrorCode.SAVECONVERTER_CONVERTBACK_VERSIONCONVERSIONERROR_0_0_0,
      ErrorMessages.SAVECONVERTER_CONVERTBACK_VERSIONCONVERSIONERROR(modifiedSave, this.version)
    );
    Log.log(LogLevel.Error, "===== end SaveConverter0_0_0.convertBack : error", error);
    throw error;
  },
  convertBackFromNext(save: ISaveVersioned): ISaveDataInstance0_0 {
    Log.log(LogLevel.Debug, "***** SaveConverter0_0_0.convertBackFromNext *****", null);
    Log.log(LogLevel.Trace, `save is being converted from next version to version ${this.version}`, null);
    Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    ErrorHelper.checkConvertBackFromNextUseless(save, this.version);
    Log.log(LogLevel.Trace, `before conversion : save ${JSON.stringify(save)}`, null);
    save.version = this.version;
    // DO ACTUAL CONVERSION
    Log.log(LogLevel.Trace, `after conversion : save ${JSON.stringify(save)}`, null);
    Log.log(LogLevel.Debug, `===== result SaveConverter0_0_0.convertBackFromNext : ${JSON.stringify(save)}`, null);
    return save as ISaveDataInstance0_0;
  },
  convertForwardFromPrevious(save: ISaveVersioned): ISaveDataInstance0_0 {
    Log.log(LogLevel.Debug, "***** SaveConverter0_0_0.convertForwardFromPrevious *****", null);
    Log.log(LogLevel.Trace, `save is being converted from previous version to version ${this.version}`, null);
    Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    ErrorHelper.checkConvertForwardFromPreviousUseless(save, this.version);
    Log.log(LogLevel.Trace, `before conversion : save ${JSON.stringify(save)}`, null);
    save.version = this.version;
    // DO ACTUAL CONVERSION
    Log.log(LogLevel.Trace, `after conversion : save ${JSON.stringify(save)}`, null);
    Log.log(LogLevel.Debug, `===== result SaveConverter0_0_0.convertForwardFromPrevious : ${JSON.stringify(save)}`, null);
    return save as ISaveDataInstance0_0;
  },
};
