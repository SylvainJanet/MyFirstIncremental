import {ErrorType} from "./errorType.js";

export class ErrorCustom extends Error {

  type: ErrorType;

  code: number;

  message: string;

  name = "ErrorCustom";

  constructor (type: ErrorType, code: number, message: string) {

    super();
    this.type = type;
    this.code = code;
    this.message = message;

  }

}
