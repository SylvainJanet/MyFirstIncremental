import type { ISavingConstants0_0 } from "./../_interfaces/ISavingConstants0_0";
import type { ISaveDataStatic0_0 } from "./../_interfaces/ISaveData0_0";
import { ErrorMessages } from "./../../../../exceptions/errorMessages";
import { ErrorCode } from "./../../../../exceptions/errorCode";
import { ErrorType } from "./../../../../exceptions/errorType";
import { ErrorCustom } from "./../../../../exceptions/errorCustom";
import { TypeHelperSavingSystem0_0 } from "../_helpers/TypeHelperSavingSystem0_0";
import type { SavingVersion } from "../../../SavingVersion";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ISavingSystem0_0 } from "../_interfaces/ISavingSystem0_0";
import type { ISaveVersioned } from "../../../interfaces/ISaveVersioned";
import { isSaveVersioned } from "../../../interfaces/ISaveVersioned";
import { Log } from "../../../../log/config";
import { LogLevel } from "typescript-logging";
import type { ISaveConverter0_0 } from "../_interfaces/ISaveConverter0_0";

// eslint-disable-next-line max-lines-per-function
export const getSavingSystem0_0 = (
  saveDataType: ISaveDataStatic0_0,
  savingConstants: ISavingConstants0_0,
  version: SavingVersion,
  converter: ISaveConverter0_0
): ISavingSystem0_0 => {
  const ErrorHelper = {
    throwErrorSaveNotFound(storageName: string): void {
      Log.log(LogLevel.Debug, "***** throwErrorSaveNotFound *****", null);
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVINGSYSTEM_LOAD_NOSAVEFOUND,
        ErrorMessages.SAVINGSYSTEM_LOAD_NOSAVEFOUND(storageName)
      );
      Log.log(LogLevel.Error, "===== end throwErrorSaveNotFound : error", error);
      throw error;
    },
    throwErrorSaveCorruptNoVersion(): void {
      Log.log(LogLevel.Debug, "***** throwErrorSaveCorruptNoVersion *****", null);
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVINGSYSTEM_LOADRAWSAVE_NOVERSION,
        ErrorMessages.SAVINGSYSTEM_LOADRAWSAVE_NOVERSION
      );
      Log.log(LogLevel.Error, "===== end throwErrorSaveCorruptNoVersion : error", error);
      throw error;
    },
    throwErrorSaveCorruptFormatOrVersion(save: ISaveVersioned): void {
      Log.log(LogLevel.Debug, "***** throwErrorSaveCorruptFormatOrVersion *****", null);
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVINGSYSTEM_LOADACTUALSAVE_CORRUPT_FORMATORVERSION,
        ErrorMessages.SAVINGSYSTEM_LOADACTUALSAVE_CORRUPT_FORMATORVERSION(save)
      );
      Log.log(LogLevel.Error, "===== end throwErrorSaveCorruptFormatOrVersion : error", error);
      throw error;
    },
  };

  const AbstractSavingSystem0_0: ISavingSystem0_0 = {
    saveData: saveDataType.getSaveData(),
    saveDataType,
    savingConstants,
    version,
    converter,

    save(): void {
      Log.log(LogLevel.Debug, "***** save *****", null);
      Log.log(LogLevel.Trace, "create save data", null);
      this.saveData = this.saveDataType.getSaveData();
      Log.log(LogLevel.Trace, "put save data in localStorage", null);
      localStorage.setItem(this.savingConstants.storageName, JSON.stringify(this.saveData));
      Log.log(LogLevel.Debug, "===== end save : OK", null);
    },

    load(): void {
      Log.log(LogLevel.Debug, "***** load *****", null);
      Log.log(LogLevel.Trace, "read localStorage", null);
      const rawObjectSaved = localStorage.getItem(this.savingConstants.storageName);
      if (rawObjectSaved === null) {
        Log.log(LogLevel.Trace, "nothing was found", null);
        ErrorHelper.throwErrorSaveNotFound(this.savingConstants.storageName);
      } else {
        Log.log(LogLevel.Debug, "===== end load : loadRawSave()", null);
        this.loadRawSave(rawObjectSaved);
      }
    },

    loadRawSave(rawObjectSaved: string): void {
      Log.log(LogLevel.Debug, "***** loadRawSave *****", null);
      Log.log(LogLevel.Trace, "parse JSON object", null);
      const anyObjectSaved = JSON.parse(rawObjectSaved);
      Log.log(LogLevel.Trace, "check version exists", null);
      if (isSaveVersioned(anyObjectSaved)) {
        Log.log(LogLevel.Debug, "===== end loadRawSave : loadActualSave()", null);
        this.loadActualSave(anyObjectSaved);
        return;
      }
      ErrorHelper.throwErrorSaveCorruptNoVersion();
    },

    // eslint-disable-next-line max-statements
    loadActualSave(actualSave: ISaveVersioned): void {
      Log.log(LogLevel.Debug, "***** loadActualSave *****", null);
      let modifiedSave = actualSave;
      Log.log(LogLevel.Trace, "does the save need to be converted ?", null);
      if (modifiedSave.version !== this.version) {
        Log.log(LogLevel.Trace, "conversion", null);
        modifiedSave = this.converter.convert(modifiedSave);
      }
      Log.log(LogLevel.Trace, "is save not corrupt and at correct version ?", null);
      if (TypeHelperSavingSystem0_0.isSaveData(modifiedSave) && modifiedSave.version === this.version) {
        Log.log(LogLevel.Trace, "save up to date", null);
        this.saveData = modifiedSave;
        Log.log(LogLevel.Debug, "===== end loadRawSave : saveDataType.loadSaveData()", null);
        this.saveDataType.loadSaveData(this.saveData);
        return;
      }
      ErrorHelper.throwErrorSaveCorruptFormatOrVersion(modifiedSave);
    },
  };
  return AbstractSavingSystem0_0;
};
