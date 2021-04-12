import { ErrorType } from "./../exceptions/errorType.js";

export class TypeHelper {
  static isErrorCustom(object: any): boolean {
    return (
      object !== null &&
      typeof object !== "undefined" &&
      typeof object.type !== "undefined" &&
      TypeHelper.isErrorType(object.type) &&
      typeof object.code === "number" &&
      typeof object.message === "string"
    );
  }

  static isErrorType(object: any): boolean {
    return object !== null && typeof object !== "undefined" && Boolean(object in ErrorType);
  }
}
