var NO_ERROR = -1, CUSTOM_CODE = 1;
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
    Object.defineProperty(ErrorCode, "CUSTOM_CODE", {
        get: function () {
            return CUSTOM_CODE;
        },
        enumerable: false,
        configurable: true
    });
    return ErrorCode;
}());
export { ErrorCode };
