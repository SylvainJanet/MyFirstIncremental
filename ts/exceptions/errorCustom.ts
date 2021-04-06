import {ErrorType} from "./errorType";

export interface ErrorCustom {
  type: ErrorType;
  code: number;
  message: string;
}
