// Import { SavingSystem0_0_1 } from "./versions/0.0/0.0.1/SavingSystem0_0_1";
import { SavingVersion } from "./SavingVersion";
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
