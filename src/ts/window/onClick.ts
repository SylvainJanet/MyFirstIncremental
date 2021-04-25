import { IdElementsConstants } from "./idElementsConstants";
import { SavingSystem } from "../savingSystem/SavingSystem";

document.getElementById(IdElementsConstants.loadButton)?.addEventListener("click", () => {
  SavingSystem.load();
});

document.getElementById(IdElementsConstants.saveButton)?.addEventListener("click", () => {
  SavingSystem.save();
});
