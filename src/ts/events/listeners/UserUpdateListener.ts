import { UserUpdate } from "../emitters/UserUpdate.js";
document.addEventListener(UserUpdate.UPDATE_EVENT_NAME, () => {
  console.log("test)");
});
