var CUSTOM_MESSAGE = "test error message";
var ErrorMessages = (function () {
    function ErrorMessages() {
    }
    Object.defineProperty(ErrorMessages, "CUSTOM_MESSAGE", {
        get: function () {
            return CUSTOM_MESSAGE;
        },
        enumerable: false,
        configurable: true
    });
    return ErrorMessages;
}());
export { ErrorMessages };
