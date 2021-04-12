export var UserUpdate = {
    UPDATE_EVENT_NAME: "updateEvent",
    update: function () {
        document.dispatchEvent(new CustomEvent(UserUpdate.UPDATE_EVENT_NAME));
    },
};
