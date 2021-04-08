import {UserUpdate} from "../emitters/UserUpdate.js";
document.addEventListener(
  UserUpdate.UPDATE_EVENT,
  () => {

    console.log("test)");

  }
);
