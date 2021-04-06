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
        var res = { "code": ErrorService.getErrorCode(),
            "message": ErrorService.getErrorMessage(),
            "type": ErrorService.getErrorType() };
        ErrorService.deal();
        return res;
    };
    ErrorService.errorCustom = { "code": -1,
        "message": "",
        "type": ErrorType.None };
    return ErrorService;
}());
export { ErrorService };
