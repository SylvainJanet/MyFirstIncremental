import type { ISaveDataInstance0_0 } from "./../_interfaces/ISaveData0_0";
/* eslint-disable max-lines */
import type { ITypeHelperSavingSystem } from "../../../interfaces/ITypeHelperSavingSystem";
import type { ISaveConverter0_0 } from "../_interfaces/ISaveConverter0_0";
import type { SavingVersion } from "../../../SavingVersion";
import { ErrorMessages } from "../../../../exceptions/errorMessages";
import { ErrorCode } from "../../../../exceptions/errorCode";
import { TypeHelperSavingSystem0_0 } from "../_helpers/TypeHelperSavingSystem0_0";
import type { ISaveVersioned } from "../../../interfaces/ISaveVersioned";
import { ErrorCustom } from "../../../../exceptions/errorCustom";
import { ErrorType } from "../../../../exceptions/errorType";
import { LogLevel } from "typescript-logging";
import { LogService } from "../../../../log/logService";

const ErrorHelper = {
  checkConvertUseless(save: ISaveVersioned, version: SavingVersion): void {
    LogService.addLevel("checkConvertUseless");
    LogService.log(LogLevel.Trace, "Save is being checked : does it have to be converted ?", null);
    LogService.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    LogService.log(LogLevel.Trace, `version : ${version}`, null);
    if (save.version === version) {
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_USELESS,
        ErrorMessages.SAVECONVERTER_USELESS(save, version)
      );
      LogService.removeLevelError(error);
      throw error;
    }
    LogService.removeLevelVoid();
  },
  checkConvertBackUseless(save: ISaveVersioned, version: SavingVersion): void {
    LogService.addLevel("checkConvertBackUseless");
    LogService.log(LogLevel.Trace, "Save is being checked : does it have to be converted back ?", null);
    LogService.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    LogService.log(LogLevel.Trace, `version : ${version}`, null);
    if (save.version <= version) {
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTBACK_USELESS,
        ErrorMessages.SAVECONVERTER_CONVERTBACK_USELESS(save, version)
      );
      LogService.removeLevelError(error);
      throw error;
    }
    LogService.removeLevelVoid();
  },
  checkConvertForwardUseless(save: ISaveVersioned, version: SavingVersion): void {
    LogService.addLevel("checkConvertForwardUseless");
    LogService.log(LogLevel.Trace, "Save is being checked : does it have to be converted forward ?", null);
    LogService.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    LogService.log(LogLevel.Trace, `version : ${version}`, null);
    if (save.version >= version) {
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTFORWARD_USELESS,
        ErrorMessages.SAVECONVERTER_CONVERTFORWARD_USELESS(save, version)
      );
      LogService.removeLevelError(error);
      throw error;
    }
    LogService.removeLevelVoid();
  },
  // eslint-disable-next-line max-statements
  checkConvertBackNextConverterNull(
    nextSaveConverter: ISaveConverter0_0 | null,
    save: ISaveVersioned,
    version: SavingVersion
  ): nextSaveConverter is ISaveConverter0_0 {
    LogService.addLevel("checkConvertBackNextConverterNull");
    LogService.log(LogLevel.Trace, "Converter is being checked : is it not null ?", null);
    LogService.log(LogLevel.Trace, `nextSaveConverter : ${JSON.stringify(nextSaveConverter)}`, null);
    LogService.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    LogService.log(LogLevel.Trace, `version : ${version}`, null);
    if (nextSaveConverter === null) {
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTBACK_ISLASTVERSION,
        ErrorMessages.SAVECONVERTER_CONVERTBACK_ISLASTVERSION(save, version)
      );
      LogService.removeLevelError(error);
      throw error;
    }
    const result = true;
    LogService.removeLevelResultPrimitive(result);
    return result;
  },
  // eslint-disable-next-line max-statements
  checkConvertForwardPreviousConverterNull(
    previousSaveConverter: ISaveConverter0_0 | null,
    save: ISaveVersioned,
    version: SavingVersion
  ): previousSaveConverter is ISaveConverter0_0 {
    LogService.addLevel("checkConvertForwardPreviousConverterNull");
    LogService.log(LogLevel.Trace, "Converter is being checked : is it not null ?", null);
    LogService.log(LogLevel.Trace, `previousSaveConverter : ${JSON.stringify(previousSaveConverter)}`, null);
    LogService.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    LogService.log(LogLevel.Trace, `version : ${version}`, null);
    if (previousSaveConverter === null) {
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTFORWARD_ISFIRSTVERSION,
        ErrorMessages.SAVECONVERTER_CONVERTFORWARD_ISFIRSTVERSION(save, version)
      );
      LogService.removeLevelError(error);
      throw error;
    }
    const result = true;
    LogService.removeLevelResultPrimitive(result);
    return result;
  },
  throwErrorConvertBackVersionError(save: ISaveVersioned, version: SavingVersion): void {
    LogService.addLevel("throwErrorConvertBackVersionError");
    LogService.log(LogLevel.Trace, "Throw error : something went wrong", null);
    LogService.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    LogService.log(LogLevel.Trace, `version : ${version}`, null);
    const error = new ErrorCustom(
      ErrorType.SaveIntegrity,
      ErrorCode.SAVECONVERTER_CONVERTBACK_VERSIONERROR,
      ErrorMessages.SAVECONVERTER_CONVERTBACK_VERSIONERROR(save, version)
    );
    LogService.removeLevelError(error);
    throw error;
  },
  throwErrorConvertForwardVersionError(save: ISaveVersioned, version: SavingVersion): void {
    LogService.addLevel("throwErrorConvertForwardVersionError");
    LogService.log(LogLevel.Trace, "Throw error : something went wrong", null);
    LogService.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    LogService.log(LogLevel.Trace, `version : ${version}`, null);
    const error = new ErrorCustom(
      ErrorType.SaveIntegrity,
      ErrorCode.SAVECONVERTER_CONVERTFORWARD_VERSIONERROR,
      ErrorMessages.SAVECONVERTER_CONVERTFORWARD_VERSIONERROR(save, version)
    );
    LogService.removeLevelError(error);
    throw error;
  },
  checkConvertBackFromNextUseless(save: ISaveVersioned, version: SavingVersion): void {
    LogService.addLevel("checkConvertBackFromNextUseless");
    LogService.log(LogLevel.Trace, "Save is being checked : does it have to be converted back ?", null);
    LogService.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    LogService.log(LogLevel.Trace, `version : ${version}`, null);
    if (save.version !== version + 1) {
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTBACKFROMNEXT,
        ErrorMessages.SAVECONVERTER_CONVERTBACKFROMNEXT(save, version + 1)
      );
      LogService.removeLevelError(error);
      throw error;
    }
    LogService.removeLevelVoid();
  },
  checkConvertForwardFromPreviousUseless(save: ISaveVersioned, version: SavingVersion): void {
    LogService.addLevel("checkConvertForwardFromPreviousUseless");
    LogService.log(LogLevel.Trace, "save is being checked : is it the previous version ?", null);
    LogService.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
    LogService.log(LogLevel.Trace, `version : ${version}`, null);
    if (save.version !== version - 1) {
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTFORWARDFROMPREVIOUS,
        ErrorMessages.SAVECONVERTER_CONVERTFORWARDFROMPREVIOUS(save, version - 1)
      );
      LogService.removeLevelError(error);
      throw error;
    }
    LogService.removeLevelVoid();
  },
  throwErrorActualConvertSaveCorruptBackFromNext(save: ISaveVersioned): void {
    LogService.addLevel("throwErrorActualConvertSaveCorruptBackFromNext");
    const error = new ErrorCustom(
      ErrorType.SaveIntegrity,
      ErrorCode.SAVECONVERTER_CONVERTBACKFROMNEXT_SAVECORRUPT,
      ErrorMessages.SAVECONVERTER_CONVERTBACKFROMNEXT_SAVECORRUPT(save)
    );
    LogService.removeLevelError(error);
    throw error;
  },
  throwErrorActualConvertSaveCorruptForwardFromPrevious(save: ISaveVersioned): void {
    LogService.addLevel("throwErrorActualConvertSaveCorruptForwardFromPrevious");
    const error = new ErrorCustom(
      ErrorType.SaveIntegrity,
      ErrorCode.SAVECONVERTER_CONVERTFORWARDFROMPREVIOUS_SAVECORRUPT,
      ErrorMessages.SAVECONVERTER_CONVERTFORWARDFROMPREVIOUS_SAVECORRUPT(save)
    );
    LogService.removeLevelError(error);
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
    // eslint-disable-next-line max-statements
    convert(save: ISaveVersioned): ISaveDataInstance0_0 {
      LogService.addLevel("AbstractSaveConverter0_0.convert");
      LogService.log(LogLevel.Trace, `save is being converted to version ${this.version}`, null);
      LogService.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
      ErrorHelper.checkConvertUseless(save, this.version);
      if (save.version < this.version) {
        const result = this.convertForward(save);
        LogService.removeLevelResultObject(save);
        return result;
      }
      const result = this.convertBack(save);
      LogService.removeLevelResultObject(save);
      return result;
    },
    // eslint-disable-next-line max-statements
    convertForward(save: ISaveVersioned): ISaveDataInstance0_0 {
      LogService.addLevel("AbstractSaveConverter0_0.convertForward");
      LogService.log(LogLevel.Trace, `older save is being convert forward to version ${this.version}`, null);
      LogService.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
      let modifiedSave = save;
      LogService.log(LogLevel.Trace, "check : is it useful to convert ?", null);
      ErrorHelper.checkConvertForwardUseless(modifiedSave, this.version);
      LogService.log(LogLevel.Trace, "check : is save older than previous ?", null);
      if (modifiedSave.version < this.version - 1) {
        LogService.log(LogLevel.Trace, "save is older than previous", null);
        LogService.log(LogLevel.Trace, "check : does converter exist ?", null);
        if (ErrorHelper.checkConvertForwardPreviousConverterNull(this.previousSaveConverter, modifiedSave, this.version)) {
          LogService.log(LogLevel.Trace, "convert save using previous converter", null);
          modifiedSave = this.previousSaveConverter.convert(modifiedSave);
        }
      }
      LogService.log(LogLevel.Trace, "check : is save previous version ?", null);
      if (modifiedSave.version === this.version - 1) {
        LogService.log(LogLevel.Trace, "save is previous version", null);
        LogService.log(LogLevel.Trace, "convert save", null);
        modifiedSave = this.convertForwardFromPrevious(modifiedSave);
      } else {
        ErrorHelper.throwErrorConvertForwardVersionError(save, this.version);
      }
      LogService.log(LogLevel.Trace, "is save now at the current version ?", null);
      if (modifiedSave.version === this.version) {
        LogService.removeLevelResultObject(modifiedSave);
        return modifiedSave as ISaveDataInstance0_0;
      }
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTFORWARD_VERSIONCONVERSIONERROR,
        ErrorMessages.SAVECONVERTER_CONVERTFORWARD_VERSIONCONVERSIONERROR(modifiedSave, this.version)
      );
      LogService.removeLevelError(error);
      throw error;
    },

    // eslint-disable-next-line max-statements
    convertBack(save: ISaveVersioned): ISaveDataInstance0_0 {
      LogService.addLevel("AbstractSaveConverter0_0.convertBack");
      LogService.log(LogLevel.Trace, `newer save is being convert back to version ${this.version}`, null);
      LogService.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
      let modifiedSave = save;
      LogService.log(LogLevel.Trace, "check : is it useful to convert ?", null);
      ErrorHelper.checkConvertBackUseless(modifiedSave, this.version);
      LogService.log(LogLevel.Trace, "check : is save newer than next ?", null);
      if (modifiedSave.version > this.version + 1) {
        LogService.log(LogLevel.Trace, "save is newer than next", null);
        LogService.log(LogLevel.Trace, "check : does converter exist ?", null);
        if (ErrorHelper.checkConvertBackNextConverterNull(this.nextSaveConverter, modifiedSave, this.version)) {
          LogService.log(LogLevel.Trace, "convert save using next converter", null);
          modifiedSave = this.nextSaveConverter.convert(modifiedSave);
        }
      }
      LogService.log(LogLevel.Trace, "check : is save next version ?", null);
      if (modifiedSave.version === this.version + 1) {
        LogService.log(LogLevel.Trace, "save is next version", null);
        LogService.log(LogLevel.Trace, "convert save", null);
        modifiedSave = this.convertBackFromNext(modifiedSave);
      } else {
        ErrorHelper.throwErrorConvertBackVersionError(save, this.version);
      }
      LogService.log(LogLevel.Trace, "is save now at the current version ?", null);
      if (modifiedSave.version === this.version) {
        LogService.removeLevelResultObject(modifiedSave);
        return modifiedSave as ISaveDataInstance0_0;
      }
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVECONVERTER_CONVERTBACK_VERSIONCONVERSIONERROR,
        ErrorMessages.SAVECONVERTER_CONVERTBACK_VERSIONCONVERSIONERROR(modifiedSave, this.version)
      );
      LogService.removeLevelError(error);
      throw error;
    },
    // eslint-disable-next-line max-statements
    convertBackFromNext(save: ISaveVersioned): ISaveDataInstance0_0 {
      LogService.addLevel("AbstractSaveConverter0_0.convertBackFromNext");
      LogService.log(LogLevel.Trace, `save is being converted from next version to version ${this.version}`, null);
      LogService.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
      ErrorHelper.checkConvertBackFromNextUseless(save, this.version);
      LogService.log(LogLevel.Trace, `before conversion : save ${JSON.stringify(save)}`, null);
      if (TypeHelperSavingSystem0_0.isSaveData(save)) {
        let modifiedSave = save;
        modifiedSave = actualConversionFromNext(save);
        LogService.log(LogLevel.Trace, `after conversion : save ${JSON.stringify(modifiedSave)}`, null);
        LogService.removeLevelResultObject(modifiedSave);
        return modifiedSave;
      }
      ErrorHelper.throwErrorActualConvertSaveCorruptBackFromNext(save);
      LogService.removeLevelResultObject(save);
      return save as ISaveDataInstance0_0;
    },
    // eslint-disable-next-line max-statements
    convertForwardFromPrevious(save: ISaveVersioned): ISaveDataInstance0_0 {
      LogService.addLevel("AbstractSaveConverter0_0.convertForwardFromPrevious");
      LogService.log(LogLevel.Trace, `save is being converted from previous version to version ${this.version}`, null);
      LogService.log(LogLevel.Trace, `save : ${JSON.stringify(save)}`, null);
      ErrorHelper.checkConvertForwardFromPreviousUseless(save, this.version);
      LogService.log(LogLevel.Trace, `before conversion : save ${JSON.stringify(save)}`, null);
      if (TypeHelperSavingSystem0_0.isSaveData(save)) {
        let modifiedSave = save;
        modifiedSave = actualConversionFromPrevious(save);
        LogService.log(LogLevel.Trace, `after conversion : save ${JSON.stringify(modifiedSave)}`, null);
        LogService.removeLevelResultObject(modifiedSave);
        return modifiedSave;
      }
      ErrorHelper.throwErrorActualConvertSaveCorruptForwardFromPrevious(save);
      LogService.removeLevelResultObject(save);
      return save as ISaveDataInstance0_0;
    },
  };
  return AbstractSaveConverter0_0;
};
