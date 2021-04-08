import { ErrorCustom } from "./errorCustom.js";
import { TypeHelper } from "./../helpers/TypeHelper.js";
var ErrorService = (function () {
    function ErrorService() {
    }
    ErrorService.getErrorType = function () {
        return ErrorService.errorCustom.type;
    };
    ErrorService.getErrorMessage = function () {
        return ErrorService.errorCustom.message;
    };
    ErrorService.getErrorCode = function () {
        return ErrorService.errorCustom.code;
    };
    ErrorService.setError = function (type, code, message) {
        ErrorService.errorCustom = new ErrorCustom(type, code, message);
    };
    ErrorService.setErrorCustom = function (error) {
        ErrorService.errorCustom = error;
    };
    ErrorService.dealtWith = function () {
        ErrorService.errorCustom = ErrorCustom.getSolvedError();
    };
    ErrorService.dealWith = function () {
        var res = new ErrorCustom(ErrorService.getErrorType(), ErrorService.getErrorCode(), ErrorService.getErrorMessage());
        ErrorService.dealtWith();
        return res;
    };
    ErrorService.errorCustom = ErrorCustom.getSolvedError();
    return ErrorService;
}());
export { ErrorService };
export var errorServiceLoader = function (error) {
    if (TypeHelper.isErrorCustom(error)) {
        var errorCustom = error;
        ErrorService.setErrorCustom(errorCustom);
    }
};
