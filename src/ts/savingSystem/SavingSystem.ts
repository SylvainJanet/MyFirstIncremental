import { SavingVersion } from "./SavingVersion";
import { SavingConstants000 } from "./versions/0.0/0.0.0/SavingConstants000";
import { SavingSystem000 } from "./versions/0.0/0.0.0/SavingSystem000";
export const SavingSystem = {
  savingConstants: SavingConstants000,
  savingSystem: SavingSystem000,
  version: SavingVersion["0.0.0"],

  save(): void {
    this.savingSystem.save();
  },
  load(): void {
    this.savingSystem.load();
  },
};
