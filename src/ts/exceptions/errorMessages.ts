import type { SavingVersion } from "./../savingSystem/SavingVersion";
import type { ISaveVersioned } from "./../savingSystem/interfaces/ISaveVersioned";

export const ErrorMessages = {
  EMPTY: "",
  SAVECONVERTER_USELESS: (save: ISaveVersioned, version: SavingVersion): string => `Save already at version ${version}\
  save : \
  ${JSON.stringify(save)}`,
  SAVECONVERTER_CONVERTBACK_VERSIONERROR: (save: ISaveVersioned, version: SavingVersion): string =>
    `Save version ${save.version} cannot be converted back to version ${version}.\
  save : \
  ${JSON.stringify(save)}`,
  SAVECONVERTER_CONVERTFORWARD_VERSIONERROR: (save: ISaveVersioned, version: SavingVersion): string =>
    `Save version ${save.version} cannot be converted forward to version ${version}.\
  save : \
  ${JSON.stringify(save)}`,
  SAVECONVERTER_CONVERTBACK_VERSIONCONVERSIONERROR: (save: ISaveVersioned, version: SavingVersion): string =>
    `Something went wrong during save conversion. Expected new save to be version ${version}, got save version ${save.version}\
  save : \
  ${JSON.stringify(save)}`,
  SAVECONVERTER_CONVERTFORWARD_VERSIONCONVERSIONERROR: (save: ISaveVersioned, version: SavingVersion): string =>
    `Something went wrong during save conversion. Expected new save to be version ${version}, got save version ${save.version}\
  save : \
  ${JSON.stringify(save)}`,
  SAVECONVERTER_CONVERTBACKFROMNEXT: (save: ISaveVersioned, version: SavingVersion): string =>
    `Expected save version ${version}, got version ${save.version}\
  save : \
  ${JSON.stringify(save)}`,
  SAVECONVERTER_CONVERTFORWARDFROMPREVIOUS: (save: ISaveVersioned, version: SavingVersion): string =>
    `Expected save version ${version}, got version ${save.version}\
  save : \
  ${JSON.stringify(save)}`,
  SAVECONVERTER_CONVERTBACK_ISLASTVERSION: (save: ISaveVersioned, version: SavingVersion): string =>
    `No save converter found to convert from version ${save.version} to version ${version}. Maybe ${version} is the last version ?\
  save : \
  ${JSON.stringify(save)}`,
  SAVECONVERTER_CONVERTFORWARD_ISFIRSTVERSION: (save: ISaveVersioned, version: SavingVersion): string =>
    `No save converter found to convert from version ${save.version} to version ${version}. Maybe ${version} is the first version ?\
  save : \
  ${JSON.stringify(save)}`,
  SAVECONVERTER_CONVERTBACK_USELESS: (save: ISaveVersioned, version: SavingVersion): string =>
    `Cannot convert back save with version ${save.version} to version ${version}.\
  save : \
  ${JSON.stringify(save)}`,
  SAVECONVERTER_CONVERTFORWARD_USELESS: (save: ISaveVersioned, version: SavingVersion): string =>
    `Cannot convert forward save with version ${save.version} to version ${version}.\
  save : \
  ${JSON.stringify(save)}`,
  TYPEHELPERSAVINGSYSTEM_GETSAVEDATA_NOTSAVEDATAINSTANCE: (object: unknown): string => `Object is not an instance of save data. \
  object : \
  ${JSON.stringify(object)}`,
  SAVINGSYSTEM_LOAD_NOSAVEFOUND: (storageName: string): string => `Nothing in localStorage was found with key ${storageName}`,
  SAVINGSYSTEM_LOADRAWSAVE_NOVERSION: "Corrupt save : doesn't have a version",
  SAVINGSYSTEM_LOADACTUALSAVE_CORRUPT_FORMATORVERSION: (save: ISaveVersioned): string =>
    `Corrupt save : either bad format or bad version\
    save\
    ${JSON.stringify(save)}`,
  SAVECONVERTER_CONVERTBACKFROMNEXT_SAVECORRUPT: (save: ISaveVersioned): string => `Corrupt save \
  save \
  ${JSON.stringify(save)}`,
  SAVECONVERTER_CONVERTFORWARDFROMPREVIOUS_SAVECORRUPT: (save: ISaveVersioned): string => `Corrupt save \
  save \
  ${JSON.stringify(save)}`,
};
