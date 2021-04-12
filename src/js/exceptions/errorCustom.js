var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { ErrorCode } from "./errorCode";
import { ErrorMessages } from "./errorMessages";
import { ErrorType } from "./errorType.js";
var ErrorCustom = (function (_super) {
    __extends(ErrorCustom, _super);
    function ErrorCustom(type, code, message) {
        var _this = _super.call(this) || this;
        _this.name = "ErrorCustom";
        _this.type = type;
        _this.code = code;
        _this.message = message;
        return _this;
    }
    ErrorCustom.getSolvedError = function () {
        return new ErrorCustom(ErrorType.None, ErrorCode.NO_ERROR, ErrorMessages.EMPTY);
    };
    ErrorCustom.isSolved = function (error) {
        return error.type === ErrorType.None && error.code === ErrorCode.NO_ERROR && error.message === ErrorMessages.EMPTY;
    };
    ErrorCustom.getLogErrorMessage = function (error) {
        return "Error - type " + ErrorType[error.type] + " - code " + error.code + " - " + error.message;
    };
    ErrorCustom.prototype.getLogErrorMessage = function () {
        return ErrorCustom.getLogErrorMessage(this);
    };
    ErrorCustom.prototype.isSolved = function () {
        return ErrorCustom.isSolved(this);
    };
    return ErrorCustom;
}(Error));
export { ErrorCustom };
