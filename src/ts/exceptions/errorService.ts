import { ErrorCustom } from "./errorCustom.js";
import type { ErrorType } from "./errorType.js";
import { TypeHelper } from "./../helpers/TypeHelper.js";

export const ErrorService = {
  dealWith(): ErrorCustom {
    const dealtWith = (): void => {
        ErrorService.errorCustom = ErrorCustom.getSolvedError();
      },
      res: ErrorCustom = new ErrorCustom(ErrorService.getErrorType(), ErrorService.getErrorCode(), ErrorService.getErrorMessage());

    dealtWith();
    return res;
  },

  errorCustom: ErrorCustom.getSolvedError(),

  getErrorCode(): number {
    return ErrorService.errorCustom.code;
  },

  getErrorMessage(): string {
    return ErrorService.errorCustom.message;
  },

  getErrorType(): ErrorType {
    return ErrorService.errorCustom.type;
  },

  setError(type: ErrorType, code: number, message: string): void {
    ErrorService.errorCustom = new ErrorCustom(type, code, message);
  },

  setErrorCustom(error: ErrorCustom): void {
    ErrorService.errorCustom = error;
  },
};

export const errorServiceLoader = (error: Error | undefined): void => {
  if (TypeHelper.isErrorCustom(error)) {
    const errorCustom = (error as unknown) as ErrorCustom;

    ErrorService.setErrorCustom(errorCustom);
  }
};
