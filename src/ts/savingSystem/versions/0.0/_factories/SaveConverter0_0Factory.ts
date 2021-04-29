/* eslint-disable max-lines */
import type { ISaveDataInstance0_0 } from "../_interfaces/ISaveData0_0";
import type { ITypeHelperSavingSystem } from "../../../interfaces/ITypeHelperSavingSystem";
import type { ISaveConverter0_0 } from "../_interfaces/ISaveConverter0_0";
import type { SavingVersion } from "../../../SavingVersion";
import { ErrorMessages } from "../../../../exceptions/errorMessages";
import { ErrorCode } from "../../../../exceptions/errorCode";
import { TypeHelperSavingSystem0_0 } from "../_helpers/TypeHelperSavingSystem0_0";
import type { ISaveVersioned } from "../../../interfaces/ISaveVersioned";
import { ErrorCustom } from "../../../../exceptions/errorCustom";
import { ErrorType } from "../../../../exceptions/errorType";
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
        ErrorCode.SAVECONVERTER_USELESS,
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
    Log.log(LogLevel.Trace, `version : ${version}`, null);
    if (save.version <= version) {
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTBACK_USELESS,
        ErrorMessages.SAVECONVERTER_CONVERTBACK_USELESS(save, version)
      );
      Log.log(LogLevel.Error, `===== end checkConvertBackUseless : error`, error);
      throw error;
    }
    Log.log(LogLevel.Debug, `===== end checkConvertBackUseless : OK`, null);
  },
  checkConvertForwardUseless(save: ISaveVersioned, version: SavingVersion): void {
    Log.log(LogLevel.Debug, "***** checkConvertForwardUseless *****", null);
    Log.log(LogLevel.Trace, "Save is being checked : does it have to be converted forward ?", null);
    Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    Log.log(LogLevel.Trace, `version : ${version}`, null);
    if (save.version >= version) {
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTFORWARD_USELESS,
        ErrorMessages.SAVECONVERTER_CONVERTFORWARD_USELESS(save, version)
      );
      Log.log(LogLevel.Error, `===== end checkConvertForwardUseless : error`, error);
      throw error;
    }
    Log.log(LogLevel.Debug, `===== end checkConvertForwardUseless : OK`, null);
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
    Log.log(LogLevel.Trace, `version : ${version}`, null);
    if (nextSaveConverter === null) {
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTBACK_ISLASTVERSION,
        ErrorMessages.SAVECONVERTER_CONVERTBACK_ISLASTVERSION(save, version)
      );
      Log.log(LogLevel.Error, `===== end checkConvertBackNextConverterNull : error`, error);
      throw error;
    }
    Log.log(LogLevel.Debug, "===== result checkConvertBackNextConverterNull : true", null);
    return true;
  },
  // eslint-disable-next-line max-statements
  checkConvertForwardPreviousConverterNull(
    previousSaveConverter: ISaveConverter0_0 | null,
    save: ISaveVersioned,
    version: SavingVersion
  ): previousSaveConverter is ISaveConverter0_0 {
    Log.log(LogLevel.Debug, "***** checkConvertForwardPreviousConverterNull *****", null);
    Log.log(LogLevel.Trace, "Converter is being checked : is it not null ?", null);
    Log.log(LogLevel.Trace, `previousSaveConverter : ${JSON.stringify(previousSaveConverter)}`, null);
    Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    Log.log(LogLevel.Trace, `version : ${version}`, null);
    if (previousSaveConverter === null) {
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTFORWARD_ISFIRSTVERSION,
        ErrorMessages.SAVECONVERTER_CONVERTFORWARD_ISFIRSTVERSION(save, version)
      );
      Log.log(LogLevel.Error, `===== end checkConvertForwardPreviousConverterNull : error`, error);
      throw error;
    }
    Log.log(LogLevel.Debug, "===== result checkConvertForwardPreviousConverterNull : true", null);
    return true;
  },
  throwErrorConvertBackVersionError(save: ISaveVersioned, version: SavingVersion): void {
    Log.log(LogLevel.Debug, "***** throwErrorConvertBackVersionError *****", null);
    Log.log(LogLevel.Trace, "Throw error : something went wrong", null);
    Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    Log.log(LogLevel.Trace, `version : ${version}`, null);
    const error = new ErrorCustom(
      ErrorType.SaveIntegrity,
      ErrorCode.SAVECONVERTER_CONVERTBACK_VERSIONERROR,
      ErrorMessages.SAVECONVERTER_CONVERTBACK_VERSIONERROR(save, version)
    );
    Log.log(LogLevel.Error, `===== end throwErrorConvertBackVersionError : error`, error);
    throw error;
  },
  throwErrorConvertForwardVersionError(save: ISaveVersioned, version: SavingVersion): void {
    Log.log(LogLevel.Debug, "***** throwErrorConvertForwardVersionError *****", null);
    Log.log(LogLevel.Trace, "Throw error : something went wrong", null);
    Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    Log.log(LogLevel.Trace, `version : ${version}`, null);
    const error = new ErrorCustom(
      ErrorType.SaveIntegrity,
      ErrorCode.SAVECONVERTER_CONVERTFORWARD_VERSIONERROR,
      ErrorMessages.SAVECONVERTER_CONVERTFORWARD_VERSIONERROR(save, version)
    );
    Log.log(LogLevel.Error, `===== end throwErrorConvertForwardVersionError : error`, error);
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
        ErrorCode.SAVECONVERTER_CONVERTBACKFROMNEXT,
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
    Log.log(LogLevel.Trace, `version : ${version}`, null);
    if (save.version !== version - 1) {
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTFORWARDFROMPREVIOUS,
        ErrorMessages.SAVECONVERTER_CONVERTFORWARDFROMPREVIOUS(save, version - 1)
      );
      Log.log(LogLevel.Error, "===== end checkConvertForwardFromPreviousUseless : error", error);
      throw error;
    }
    Log.log(LogLevel.Debug, "===== end checkConvertForwardFromPreviousUseless : OK", null);
  },
  throwErrorActualConvertSaveCorruptBackFromNext(save: ISaveVersioned): void {
    Log.log(LogLevel.Debug, "***** throwErrorActualConvertSaveCorruptBackFromNext *****", null);
    const error = new ErrorCustom(
      ErrorType.SaveIntegrity,
      ErrorCode.SAVECONVERTER_CONVERTBACKFROMNEXT_SAVECORRUPT,
      ErrorMessages.SAVECONVERTER_CONVERTBACKFROMNEXT_SAVECORRUPT(save)
    );
    Log.log(LogLevel.Error, "===== end throwErrorActualConvertSaveCorruptBackFromNext : error", error);
    throw error;
  },
  throwErrorActualConvertSaveCorruptForwardFromPrevious(save: ISaveVersioned): void {
    Log.log(LogLevel.Debug, "***** throwErrorActualConvertSaveCorruptForwardFromPrevious *****", null);
    const error = new ErrorCustom(
      ErrorType.SaveIntegrity,
      ErrorCode.SAVECONVERTER_CONVERTFORWARDFROMPREVIOUS_SAVECORRUPT,
      ErrorMessages.SAVECONVERTER_CONVERTFORWARDFROMPREVIOUS_SAVECORRUPT(save)
    );
    Log.log(LogLevel.Error, "===== end throwErrorActualConvertSaveCorruptForwardFromPrevious : error", error);
    throw error;
  },
};

// eslint-disable-next-line max-lines-per-function
export const getSaveConverter0_0 = (
  typeHelper: ITypeHelperSavingSystem<ISaveDataInstance0_0>,
  version: SavingVersion,
  previousSaveConverter: ISaveConverter0_0 | null,
  nextSaveConverter: ISaveConverter0_0 | null,
  actualConversionFromNext: (save: ISaveDataInstance0_0) => ISaveDataInstance0_0,
  actualConversionFromPrevious: (save: ISaveDataInstance0_0) => ISaveDataInstance0_0
): ISaveConverter0_0 => {
  const AbstractSaveConverter0_0: ISaveConverter0_0 = {
    typeHelper,
    version,
    previousSaveConverter,
    nextSaveConverter,
    convert(save: ISaveVersioned): ISaveDataInstance0_0 {
      Log.log(LogLevel.Debug, "***** AbstractSaveConverter0_0.convert *****", null);
      Log.log(LogLevel.Trace, `save is being converted to version ${this.version}`, null);
      Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
      ErrorHelper.checkConvertUseless(save, this.version);
      if (save.version < this.version) {
        Log.log(LogLevel.Debug, "===== end AbstractSaveConverter0_0.convert : convertForward()", null);
        return this.convertForward(save);
      }
      Log.log(LogLevel.Debug, "===== end AbstractSaveConverter0_0.convert : convertBack()", null);
      return this.convertBack(save);
    },
    // eslint-disable-next-line max-statements
    convertForward(save: ISaveVersioned): ISaveDataInstance0_0 {
      Log.log(LogLevel.Debug, "***** AbstractSaveConverter0_0.convertForward *****", null);
      Log.log(LogLevel.Trace, `older save is being convert forward to version ${this.version}`, null);
      Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
      let modifiedSave = save;
      Log.log(LogLevel.Trace, "check : is it useful to convert ?", null);
      ErrorHelper.checkConvertForwardUseless(modifiedSave, this.version);
      Log.log(LogLevel.Trace, "check : is save older than previous ?", null);
      if (modifiedSave.version < this.version - 1) {
        Log.log(LogLevel.Trace, "save is older than previous", null);
        Log.log(LogLevel.Trace, "check : does converter exist ?", null);
        if (ErrorHelper.checkConvertForwardPreviousConverterNull(this.previousSaveConverter, modifiedSave, this.version)) {
          Log.log(LogLevel.Trace, "convert save using previous converter", null);
          modifiedSave = this.previousSaveConverter.convert(modifiedSave);
        }
      }
      Log.log(LogLevel.Trace, "check : is save previous version ?", null);
      if (modifiedSave.version === this.version - 1) {
        Log.log(LogLevel.Trace, "save is previous version", null);
        Log.log(LogLevel.Trace, "convert save", null);
        modifiedSave = this.convertForwardFromPrevious(modifiedSave);
      } else {
        ErrorHelper.throwErrorConvertForwardVersionError(save, this.version);
      }
      Log.log(LogLevel.Trace, "is save now at the current version ?", null);
      if (modifiedSave.version === this.version) {
        Log.log(LogLevel.Debug, `===== result AbstractSaveConverter0_0.convertForward : ${JSON.stringify(modifiedSave)}`, null);
        return modifiedSave as ISaveDataInstance0_0;
      }
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTFORWARD_VERSIONCONVERSIONERROR,
        ErrorMessages.SAVECONVERTER_CONVERTFORWARD_VERSIONCONVERSIONERROR(modifiedSave, this.version)
      );
      Log.log(LogLevel.Error, "===== end AbstractSaveConverter0_0.convertForward : error", error);
      throw error;
    },

    // eslint-disable-next-line max-statements
    convertBack(save: ISaveVersioned): ISaveDataInstance0_0 {
      Log.log(LogLevel.Debug, "***** AbstractSaveConverter0_0.convertBack *****", null);
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
        Log.log(LogLevel.Debug, `===== result AbstractSaveConverter0_0.convertBack : ${JSON.stringify(modifiedSave)}`, null);
        return modifiedSave as ISaveDataInstance0_0;
      }
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTBACK_VERSIONCONVERSIONERROR,
        ErrorMessages.SAVECONVERTER_CONVERTBACK_VERSIONCONVERSIONERROR(modifiedSave, this.version)
      );
      Log.log(LogLevel.Error, "===== end AbstractSaveConverter0_0.convertBack : error", error);
      throw error;
    },
    // eslint-disable-next-line max-statements
    convertBackFromNext(save: ISaveVersioned): ISaveDataInstance0_0 {
      Log.log(LogLevel.Debug, "***** AbstractSaveConverter0_0.convertBackFromNext *****", null);
      Log.log(LogLevel.Trace, `save is being converted from next version to version ${this.version}`, null);
      Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
      ErrorHelper.checkConvertBackFromNextUseless(save, this.version);
      Log.log(LogLevel.Trace, `before conversion : save ${JSON.stringify(save)}`, null);
      if (TypeHelperSavingSystem0_0.isSaveData(save)) {
        let modifiedSave = save;
        modifiedSave = actualConversionFromNext(save);
        Log.log(LogLevel.Trace, `after conversion : save ${JSON.stringify(modifiedSave)}`, null);
        Log.log(LogLevel.Debug, `===== result AbstractSaveConverter0_0.convertBackFromNext : ${JSON.stringify(modifiedSave)}`, null);
        return modifiedSave;
      }
      Log.log(
        LogLevel.Debug,
        `===== end AbstractSaveConverter0_0.convertBackFromNext : throwErrorActualConvertSaveCorruptBackFromNext()`,
        null
      );
      ErrorHelper.throwErrorActualConvertSaveCorruptBackFromNext(save);
      return save as ISaveDataInstance0_0;
    },
    // eslint-disable-next-line max-statements
    convertForwardFromPrevious(save: ISaveVersioned): ISaveDataInstance0_0 {
      Log.log(LogLevel.Debug, "***** AbstractSaveConverter0_0.convertForwardFromPrevious *****", null);
      Log.log(LogLevel.Trace, `save is being converted from previous version to version ${this.version}`, null);
      Log.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
      ErrorHelper.checkConvertForwardFromPreviousUseless(save, this.version);
      Log.log(LogLevel.Trace, `before conversion : save ${JSON.stringify(save)}`, null);
      if (TypeHelperSavingSystem0_0.isSaveData(save)) {
        let modifiedSave = save;
        modifiedSave = actualConversionFromPrevious(save);
        Log.log(LogLevel.Trace, `after conversion : save ${JSON.stringify(modifiedSave)}`, null);
        Log.log(LogLevel.Debug, `===== result AbstractSaveConverter0_0.convertForwardFromPrevious : ${JSON.stringify(modifiedSave)}`, null);
        return modifiedSave;
      }
      Log.log(
        LogLevel.Debug,
        `===== end AbstractSaveConverter0_0.convertForwardFromPrevious : throwErrorActualConvertSaveCorruptForwardFromPrevious()`,
        null
      );
      ErrorHelper.throwErrorActualConvertSaveCorruptForwardFromPrevious(save);
      return save as ISaveDataInstance0_0;
    },
  };
  return AbstractSaveConverter0_0;
};
