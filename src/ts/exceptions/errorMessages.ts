import type { ISaveVersioned } from "./../savingSystem/interfaces/ISaveVersioned";
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SavingVersion } from "../savingSystem/SavingVersion";

export const ErrorMessages = {
  EMPTY: "",
  SAVECONVERTER_USELESS: (save: ISaveVersioned, version: SavingVersion): string => `Save already at version ${version}\
  save : \
  ${String(save)}`,
  SAVECONVERTER_VERSION_INCORRECT: (save: ISaveVersioned): string => `Save version '${save.version}' is not valid`,
  SAVECONVERTER_CONVERTBACK_VERSIONERROR: (save: ISaveVersioned, version: SavingVersion): string =>
    `Save version ${save.version} cannot be converted back to version ${version}. May need to be converted forward to version ${version}`,
  SAVECONVERTER_CONVERTBACK_VERSIONCONVERSIONERROR: (save: ISaveVersioned, version: SavingVersion): string =>
    `Something went wrong during save conversion. Expected new save to be version ${version}, got save version ${save.version}`,
  SAVECONVERTER_CONVERTBACKFROMNEXT: (save: ISaveVersioned, version: SavingVersion): string =>
    `Expected save version ${version}, got version ${save.version}`,
  SAVECONVERTER_CONVERTFORWARDFROMPREVIOUS: (save: ISaveVersioned, version: SavingVersion): string =>
    `Expected save version ${version}, got version ${save.version}`,
  SAVECONVERTER_CONVERTBACK_ISLASTVERSION: (save: ISaveVersioned, version: SavingVersion): string =>
    `No save converter found to convert from version ${save.version} to version ${version}. Maybe ${version}is the last version ?`,
};
