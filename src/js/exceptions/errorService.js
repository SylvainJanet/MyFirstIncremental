import { ErrorCustom } from "./errorCustom.js";
import { TypeHelper } from "./../helpers/TypeHelper.js";
export var ErrorService = {
    dealWith: function () {
        var dealtWith = function () {
            ErrorService.errorCustom = ErrorCustom.getSolvedError();
        }, res = new ErrorCustom(ErrorService.getErrorType(), ErrorService.getErrorCode(), ErrorService.getErrorMessage());
        dealtWith();
        return res;
    },
    errorCustom: ErrorCustom.getSolvedError(),
    getErrorCode: function () {
        return ErrorService.errorCustom.code;
    },
    getErrorMessage: function () {
        return ErrorService.errorCustom.message;
    },
    getErrorType: function () {
        return ErrorService.errorCustom.type;
    },
    setError: function (type, code, message) {
        ErrorService.errorCustom = new ErrorCustom(type, code, message);
    },
    setErrorCustom: function (error) {
        ErrorService.errorCustom = error;
    },
};
export var errorServiceLoader = function (error) {
    if (TypeHelper.isErrorCustom(error)) {
        var errorCustom = error;
        ErrorService.setErrorCustom(errorCustom);
    }
};
