import { SavingVersion } from "./SavingVersion";
import { SaveDataInstance0_0_0 } from "./versions/0.0/0.0.0/SaveData0_0_0";
import { SavingSystem0_0_0 } from "./versions/0.0/0.0.0/SavingSystem0_0_0";
export const SavingSystem = {
  savingConstants: SavingSystem0_0_0.savingConstants,
  savingSystem: SavingSystem0_0_0,
  version: SavingVersion["0.0.0"],

  checkVersions(): void {
    if (this.savingConstants.version !== this.version) {
      console.log("erreur : mauvaise version : savingConstants");
    }
    if (this.savingSystem.version !== this.version) {
      console.log("erreur : mauvaise version : savingSystem");
    }
    if (this.savingSystem.saveData.version !== this.version) {
      console.log("erreur : mauvaise version : saveData");
      console.log(typeof SaveDataInstance0_0_0);
    }
  },

  save(): void {
    this.checkVersions();
    this.savingSystem.save();
  },
  load(): void {
    this.checkVersions();
    this.savingSystem.load();
  },
};
