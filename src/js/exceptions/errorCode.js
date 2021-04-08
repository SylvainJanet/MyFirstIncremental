var NO_ERROR = -1, TEST = 0;
var ErrorCode = (function () {
    function ErrorCode() {
    }
    Object.defineProperty(ErrorCode, "NO_ERROR", {
        get: function () {
            return NO_ERROR;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ErrorCode, "TEST", {
        get: function () {
            return TEST;
        },
        enumerable: false,
        configurable: true
    });
    return ErrorCode;
}());
export { ErrorCode };
