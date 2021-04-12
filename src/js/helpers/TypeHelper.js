import { ErrorType } from "./../exceptions/errorType.js";
export var TypeHelper = {
    isErrorCustom: function (object) {
        return (object !== null &&
            typeof object !== "undefined" &&
            typeof object.type !== "undefined" &&
            TypeHelper.isErrorType(object.type) &&
            typeof object.code === "number" &&
            typeof object.message === "string");
    },
    isErrorType: function (object) {
        return object !== null && typeof object !== "undefined" && Boolean(object in ErrorType);
    },
};
