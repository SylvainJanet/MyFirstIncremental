import { ErrorCode } from "./errorCode";
import { ErrorMessages } from "./errorMessages";
import { ErrorType } from "./errorType.js";

export class ErrorCustom extends Error {
  public type: ErrorType;

  public code: number;

  public message: string;

  public name = "ErrorCustom";

  public constructor(type: ErrorType, code: number, message: string) {
    super();
    this.type = type;
    this.code = code;
    this.message = message;
  }

  public static getSolvedError(): ErrorCustom {
    return new ErrorCustom(ErrorType.None, ErrorCode.NO_ERROR, ErrorMessages.EMPTY);
  }

  public static isSolved(error: ErrorCustom): boolean {
    return error.type === ErrorType.None && error.code === ErrorCode.NO_ERROR && error.message === ErrorMessages.EMPTY;
  }

  public static getLogErrorMessage(error: ErrorCustom): string {
    return `Error - type ${ErrorType[error.type]} - code ${error.code} - ${error.message}`;
  }

  public getLogErrorMessage(): string {
    return ErrorCustom.getLogErrorMessage(this);
  }

  public isSolved(): boolean {
    return ErrorCustom.isSolved(this);
  }
}
