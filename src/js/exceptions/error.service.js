import { ErrorCode } from "./errorCode";
import { ErrorCustom } from "./errorCustom";
import { ErrorType } from "./errorType";
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
    ErrorService.setError = function (type, message, code) {
        ErrorService.errorCustom.type = type;
        ErrorService.errorCustom.message = message;
        ErrorService.errorCustom.code = code;
    };
    ErrorService.deal = function () {
        ErrorService.errorCustom.type = ErrorType.None;
        ErrorService.errorCustom.message = "";
        ErrorService.errorCustom.code = -1;
    };
    ErrorService.dealWith = function () {
        var res = new ErrorCustom(ErrorService.getErrorType(), ErrorService.getErrorCode(), ErrorService.getErrorMessage());
        ErrorService.deal();
        return res;
    };
    ErrorService.errorCustom = new ErrorCustom(ErrorType.None, ErrorCode.NO_ERROR, "");
    return ErrorService;
}());
export { ErrorService };
