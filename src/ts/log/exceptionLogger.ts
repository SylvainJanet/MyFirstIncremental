import {ErrorCustom} from "./../exceptions/errorCustom.js";
import {ErrorService} from "../exceptions/errorService.js";
import {Log} from "./config.js";
import {TypeHelper} from "./../helpers/TypeHelper.js";

const NOT_CUSTOM_ERROR = "not custom error",
  UNDEFINED_ERROR = "undefined error",

  logErrorCustom = (errorCustom: ErrorCustom) => {

    Log.error(
      ErrorCustom.getLogErrorMessage(errorCustom),
      errorCustom
    );

    // eslint-disable-next-line no-alert
    alert(ErrorCustom.getLogErrorMessage(errorCustom));
    ErrorService.dealWith();

  },

  logErrorNotCustom = (error: Error) => {

    Log.fatal(
      `${NOT_CUSTOM_ERROR} - ${error.message}`,
      error
    );

  },

  logUndefined = () => {

    Log.fatal(
      UNDEFINED_ERROR,
      new Error()
    );

  };

// eslint-disable-next-line max-params
// eslint-disable-next-line one-var
export const exceptionLogger = (error: Error | undefined) => {

  if (TypeHelper.isErrorCustom(error)) {

    logErrorCustom((error as unknown) as ErrorCustom);
    return true;

  }

  if (error) {

    logErrorNotCustom(error as Error);
    return false;

  }

  logUndefined();
  return false;

};
