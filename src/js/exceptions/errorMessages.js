var EMPTY = "", TEST = "test error message";
var ErrorMessages = (function () {
    function ErrorMessages() {
    }
    Object.defineProperty(ErrorMessages, "TEST", {
        get: function () {
            return TEST;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ErrorMessages, "EMPTY", {
        get: function () {
            return EMPTY;
        },
        enumerable: false,
        configurable: true
    });
    return ErrorMessages;
}());
export { ErrorMessages };
