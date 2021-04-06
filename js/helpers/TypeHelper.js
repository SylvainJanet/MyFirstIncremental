import { ErrorType } from "./../exceptions/errorType.js";
var TypeHelper = (function () {
    function TypeHelper() {
    }
    TypeHelper.isErrorCustom = function (object) {
        return typeof object !== "undefined" &&
            typeof object.type !== "undefined" &&
            TypeHelper.isErrorType(object.type) &&
            typeof object.code === "number" &&
            typeof object.message === "string";
    };
    TypeHelper.isErrorType = function (object) {
        return typeof object !== "undefined" && Boolean(object in ErrorType);
    };
    return TypeHelper;
}());
export { TypeHelper };
