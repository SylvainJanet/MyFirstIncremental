var UPDATE_EVENT_NAME = "updateEvent";
var UserUpdate = (function () {
    function UserUpdate() {
    }
    UserUpdate.update = function () {
        document.dispatchEvent(new CustomEvent(UserUpdate.UPDATE_EVENT));
    };
    Object.defineProperty(UserUpdate, "UPDATE_EVENT", {
        get: function () {
            return UPDATE_EVENT_NAME;
        },
        enumerable: false,
        configurable: true
    });
    return UserUpdate;
}());
export { UserUpdate };
