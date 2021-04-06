var CUSTOM_CODE = 1;
var ErrorMessages = (function () {
    function ErrorMessages() {
    }
    Object.defineProperty(ErrorMessages, "CUSTOM_CODE", {
        get: function () {
            return CUSTOM_CODE;
        },
        enumerable: false,
        configurable: true
    });
    return ErrorMessages;
}());
export { ErrorMessages };
