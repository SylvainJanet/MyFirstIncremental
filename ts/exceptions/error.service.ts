import {ErrorCode} from "./errorCode";
import {ErrorCustom} from "./errorCustom";
import {ErrorType} from "./errorType";

export class ErrorService {

  static errorCustom = new ErrorCustom(
    ErrorType.None,
    ErrorCode.NO_ERROR,
    ""
  );

  static getErrorType (): ErrorType {

    return ErrorService.errorCustom.type;

  }

  static getErrorMessage (): string {

    return ErrorService.errorCustom.message;

  }

  static getErrorCode (): number {

    return ErrorService.errorCustom.code;

  }

  static setError (type: ErrorType, message: string, code: number): void {

    ErrorService.errorCustom.type = type;
    ErrorService.errorCustom.message = message;
    ErrorService.errorCustom.code = code;

  }

  static deal (): void {

    ErrorService.errorCustom.type = ErrorType.None;
    ErrorService.errorCustom.message = "";
    ErrorService.errorCustom.code = -1;

  }

  static dealWith (): ErrorCustom {

    const res: ErrorCustom = new ErrorCustom(
      ErrorService.getErrorType(),
      ErrorService.getErrorCode(),
      ErrorService.getErrorMessage()
    );
    ErrorService.deal();
    return res;

  }

}
