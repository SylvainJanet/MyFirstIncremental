import { ErrorCustom } from "./../exceptions/errorCustom.js";
import { Log } from "./config.js";
import { TypeHelper } from "./../helpers/TypeHelper.js";
var NOT_CUSTOM_ERROR = "not custom error", UNDEFINED_ERROR = "undefined error";
export var exceptionLogger = function (error) {
    if (TypeHelper.isErrorCustom(error)) {
        var errorCustom = error;
        Log.error(ErrorCustom.getLogErrorMessage(errorCustom), errorCustom);
        return true;
    }
    if (error) {
        Log.fatal(NOT_CUSTOM_ERROR + " - " + (error === null || error === void 0 ? void 0 : error.message), error);
        return false;
    }
    Log.fatal(UNDEFINED_ERROR, new Error());
    return false;
};
