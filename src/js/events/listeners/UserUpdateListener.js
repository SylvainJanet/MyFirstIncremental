import { UserUpdate } from "../emitters/UserUpdate.js";
document.addEventListener(UserUpdate.UPDATE_EVENT, function () {
    console.log("test)");
});
