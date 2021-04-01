"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserUpdate = void 0;
var updateEvent = new CustomEvent("updateEvent");
var UserUpdate = (function () {
    function UserUpdate() {
    }
    UserUpdate.update = function () {
        document.dispatchEvent(updateEvent);
    };
    return UserUpdate;
}());
exports.UserUpdate = UserUpdate;
