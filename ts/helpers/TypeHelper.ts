import {ErrorType} from "./../exceptions/errorType";
export class TypeHelper {

  static isErrorCustom (object: any): boolean {

    return object && object.type && TypeHelper.isErrorType(object.type) &&
      object.code && typeof object.code === "number" &&
      object.message && typeof object.message === "string";

  }

  static isErrorType (object: any): boolean {

    return object && object in ErrorType;

  }

}
