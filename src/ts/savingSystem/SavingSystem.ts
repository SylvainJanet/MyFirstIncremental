/*
 * Import { SavingSystem00 } from "./versions/0.0/SavingSystem00";
 * import { SavingConstants00 } from "./versions/0.0/SavingConstants00";
 */
import { SavingSystem002 } from "./versions/0.0.2/SavingSystem002";
// Import { SavingSystem001 } from "./versions/0.0.1/SavingSystem001";

import { SavingVersion } from "./SavingVersion";
// Import { SavingConstants001 } from "./versions/0.0.1/SavingConstants001";
import { SavingConstants002 } from "./versions/0.0.2/SavingConstants002";

export const SavingSystem = {
  savingConstants: SavingConstants002,
  savingSystem: SavingSystem002,
  version: SavingVersion["0.0.2"],

  save(): void {
    this.savingSystem.save();
  },
  load(): void {
    this.savingSystem.load();
  },
};
