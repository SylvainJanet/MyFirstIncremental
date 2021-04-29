import { ErrorCustom } from "./../exceptions/errorCustom.js";
import { ErrorService } from "../exceptions/errorService.js";
import { Log } from "./config.js";
import { TypeHelper } from "./../helpers/TypeHelper.js";

const NOT_CUSTOM_ERROR = "not custom error",
  UNDEFINED_ERROR = "undefined error",
  logErrorCustom = (errorCustom: ErrorCustom): void => {
    Log.error(ErrorCustom.getLogErrorMessage(errorCustom), errorCustom);

    // TRAITEMENT D'UNE ERREUR
    // eslint-disable-next-line no-alert
    alert(ErrorCustom.getLogErrorMessage(errorCustom));
    ErrorService.dealWith();
  },
  logErrorNotCustom = (error: Error): void => {
    Log.fatal(`${NOT_CUSTOM_ERROR} - ${error.message}`, error);
  },
  logUndefined = (): void => {
    Log.fatal(UNDEFINED_ERROR, new Error());
  };

export const exceptionLogger = (error: Error | undefined): boolean => {
  if (TypeHelper.isErrorCustom(error)) {
    logErrorCustom((error as unknown) as ErrorCustom);
    return true;
  }

  if (error) {
    logErrorNotCustom(error);
    return false;
  }

  logUndefined();
  return false;
};
