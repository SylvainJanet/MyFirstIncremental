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
import { LogLevel } from "typescript-logging";
import type { ISaveConverter0_0 } from "../_interfaces/ISaveConverter0_0";
import { LogService } from "../../../../log/logService";

// eslint-disable-next-line max-lines-per-function
export const getSavingSystem0_0 = (
  saveDataType: ISaveDataStatic0_0,
  savingConstants: ISavingConstants0_0,
  version: SavingVersion,
  converter: ISaveConverter0_0
): ISavingSystem0_0 => {
  const ErrorHelper = {
    throwErrorSaveNotFound(storageName: string): void {
      LogService.addLevel("throwErrorSaveNotFound");
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVINGSYSTEM_LOAD_NOSAVEFOUND,
        ErrorMessages.SAVINGSYSTEM_LOAD_NOSAVEFOUND(storageName)
      );
      LogService.removeLevelError(error);
      throw error;
    },
    throwErrorSaveCorruptNoVersion(): void {
      LogService.addLevel("throwErrorSaveCorruptNoVersion");
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVINGSYSTEM_LOADRAWSAVE_NOVERSION,
        ErrorMessages.SAVINGSYSTEM_LOADRAWSAVE_NOVERSION
      );
      LogService.removeLevelError(error);
      throw error;
    },
    throwErrorSaveCorruptFormatOrVersion(save: ISaveVersioned): void {
      LogService.addLevel("throwErrorSaveCorruptFormatOrVersion");
      const error = new ErrorCustom(
        ErrorType.SaveIntegrity,
        ErrorCode.SAVINGSYSTEM_LOADACTUALSAVE_CORRUPT_FORMATORVERSION,
        ErrorMessages.SAVINGSYSTEM_LOADACTUALSAVE_CORRUPT_FORMATORVERSION(save)
      );
      LogService.removeLevelError(error);
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
      LogService.addLevel("AbstractSavingSystem0_0.save");
      LogService.log(LogLevel.Trace, "create save data", null);
      this.saveData = this.saveDataType.getSaveData();
      LogService.log(LogLevel.Trace, "put save data in localStorage", null);
      localStorage.setItem(this.savingConstants.storageName, JSON.stringify(this.saveData));
      LogService.removeLevelVoid();
    },

    load(): void {
      LogService.addLevel("AbstractSavingSystem0_0.load");
      LogService.log(LogLevel.Trace, "read localStorage", null);
      const rawObjectSaved = localStorage.getItem(this.savingConstants.storageName);
      if (rawObjectSaved === null) {
        LogService.log(LogLevel.Trace, "nothing was found", null);
        ErrorHelper.throwErrorSaveNotFound(this.savingConstants.storageName);
      } else {
        this.loadRawSave(rawObjectSaved);
        LogService.removeLevelVoid();
      }
    },

    loadRawSave(rawObjectSaved: string): void {
      LogService.addLevel("AbstractSavingSystem0_0.loadRawSave");
      LogService.log(LogLevel.Trace, "parse JSON object", null);
      const anyObjectSaved = JSON.parse(rawObjectSaved);
      LogService.log(LogLevel.Trace, "check version exists", null);
      if (isSaveVersioned(anyObjectSaved)) {
        this.loadActualSave(anyObjectSaved);
        LogService.removeLevelVoid();
        return;
      }
      ErrorHelper.throwErrorSaveCorruptNoVersion();
    },

    // eslint-disable-next-line max-statements
    loadActualSave(actualSave: ISaveVersioned): void {
      LogService.addLevel("AbstractSavingSystem0_0.loadActualSave");
      let modifiedSave = actualSave;
      LogService.log(LogLevel.Trace, "does the save need to be converted ?", null);
      if (modifiedSave.version !== this.version) {
        LogService.log(LogLevel.Trace, "conversion", null);
        modifiedSave = this.converter.convert(modifiedSave);
      }
      LogService.log(LogLevel.Trace, "is save not corrupt and at correct version ?", null);
      if (TypeHelperSavingSystem0_0.isSaveData(modifiedSave) && modifiedSave.version === this.version) {
        LogService.log(LogLevel.Trace, "save up to date", null);
        this.saveData = modifiedSave;
        this.saveDataType.loadSaveData(this.saveData);
        LogService.removeLevelVoid();
        return;
      }
      ErrorHelper.throwErrorSaveCorruptFormatOrVersion(modifiedSave);
    },
  };
  return AbstractSavingSystem0_0;
};
