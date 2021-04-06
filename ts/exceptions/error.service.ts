import { TypeHelper } from './../helpers/TypeHelper';
import {ErrorCustom} from "./errorCustom";
import {ErrorType} from "./errorType";

export class ErrorService {

  static errorCustom: ErrorCustom = {"code": -1,
    "message": "",
    "type": ErrorType.None};

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

    const res: ErrorCustom = {"code": ErrorService.getErrorCode(),
      "message": ErrorService.getErrorMessage(),
      "type": ErrorService.getErrorType()};
    ErrorService.deal();
    return res;

  }

}


// eslint-disable-next-line no-console
window.onerror = (_message, _source, _lineno, _colno, error) => {

  console.log(`ceci est un test d'erreur : ${error?.message}`);
  if (TypeHelper.isErrorCustom(error)) {
    const errorCustom = ((error as unknown) as ErrorCustom);
    console.log("message" + errorCustom.message);
    console.log("code" + errorCustom.code);
    console.log("type" + errorCustom.type)
  }

};
