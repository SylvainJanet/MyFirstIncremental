var updateEvent = new CustomEvent("updateEvent");
var UserUpdate = (function () {
    function UserUpdate() {
    }
    UserUpdate.update = function () {
        document.dispatchEvent(updateEvent);
    };
    return UserUpdate;
}());
export { UserUpdate };
