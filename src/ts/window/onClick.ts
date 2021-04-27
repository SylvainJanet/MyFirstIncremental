import { SavingSystem } from "../savingSystem/SavingSystem";
import { IdElementsConstants } from "./IdElementsConstants";

document.getElementById(IdElementsConstants.loadButton)?.addEventListener("click", () => {
  SavingSystem.load();
});

document.getElementById(IdElementsConstants.saveButton)?.addEventListener("click", () => {
  SavingSystem.save();
});
