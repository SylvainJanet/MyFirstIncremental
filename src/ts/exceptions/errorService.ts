import { ErrorCustom } from "./errorCustom.js";
import type { ErrorType } from "./errorType.js";
import { TypeHelper } from "./../helpers/TypeHelper.js";

export class ErrorService {
  static errorCustom: ErrorCustom = ErrorCustom.getSolvedError();

  static getErrorType(): ErrorType {
    return ErrorService.errorCustom.type;
  }

  static getErrorMessage(): string {
    return ErrorService.errorCustom.message;
  }

  static getErrorCode(): number {
    return ErrorService.errorCustom.code;
  }

  static setError(type: ErrorType, code: number, message: string): void {
    ErrorService.errorCustom = new ErrorCustom(type, code, message);
  }

  static setErrorCustom(error: ErrorCustom): void {
    ErrorService.errorCustom = error;
  }

  private static dealtWith(): void {
    ErrorService.errorCustom = ErrorCustom.getSolvedError();
  }

  static dealWith(): ErrorCustom {
    const res: ErrorCustom = new ErrorCustom(ErrorService.getErrorType(), ErrorService.getErrorCode(), ErrorService.getErrorMessage());
    ErrorService.dealtWith();
    return res;
  }
}

export const errorServiceLoader = (error: Error | undefined) => {
  if (TypeHelper.isErrorCustom(error)) {
    const errorCustom = (error as unknown) as ErrorCustom;

    ErrorService.setErrorCustom(errorCustom);
  }
};
