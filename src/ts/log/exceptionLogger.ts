import {ErrorCustom} from "./../exceptions/errorCustom.js";
import {Log} from "./config.js";
import {TypeHelper} from "./../helpers/TypeHelper.js";

const NOT_CUSTOM_ERROR = "not custom error",
  UNDEFINED_ERROR = "undefined error";

// eslint-disable-next-line max-params
// eslint-disable-next-line one-var
export const exceptionLogger = (error: Error | undefined) => {

  if (TypeHelper.isErrorCustom(error)) {

    const errorCustom = (error as unknown) as ErrorCustom;

    Log.error(
      ErrorCustom.getLogErrorMessage(errorCustom),
      errorCustom
    );

    return true;

  }

  if (error) {

    Log.fatal(
      `${NOT_CUSTOM_ERROR} - ${error?.message}`,
      error
    );
    return false;

  }

  Log.fatal(
    UNDEFINED_ERROR,
    new Error()
  );
  return false;

};
