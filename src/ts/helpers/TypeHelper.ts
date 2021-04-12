// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// /* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorType } from "./../exceptions/errorType.js";

export const TypeHelper = {
  isErrorCustom(object: any): boolean {
    return (
      object !== null &&
      typeof object !== "undefined" &&
      typeof object.type !== "undefined" &&
      TypeHelper.isErrorType(object.type) &&
      typeof object.code === "number" &&
      typeof object.message === "string"
    );
  },

  isErrorType(object: any): boolean {
    return object !== null && typeof object !== "undefined" && Boolean(object in ErrorType);
  },
};
