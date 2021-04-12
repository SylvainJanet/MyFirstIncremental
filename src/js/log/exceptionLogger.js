import { ErrorCustom } from "./../exceptions/errorCustom.js";
import { ErrorService } from "../exceptions/errorService.js";
import { log } from "./config.js";
import { TypeHelper } from "./../helpers/TypeHelper.js";
var NOT_CUSTOM_ERROR = "not custom error", UNDEFINED_ERROR = "undefined error", logErrorCustom = function (errorCustom) {
    log.error(ErrorCustom.getLogErrorMessage(errorCustom), errorCustom);
    alert(ErrorCustom.getLogErrorMessage(errorCustom));
    ErrorService.dealWith();
}, logErrorNotCustom = function (error) {
    log.fatal(NOT_CUSTOM_ERROR + " - " + error.message, error);
}, logUndefined = function () {
    log.fatal(UNDEFINED_ERROR, new Error());
};
export var exceptionLogger = function (error) {
    if (TypeHelper.isErrorCustom(error)) {
        logErrorCustom(error);
        return true;
    }
    if (error) {
        logErrorNotCustom(error);
        return false;
    }
    logUndefined();
    return false;
};
