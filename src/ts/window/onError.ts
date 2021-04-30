import { errorServiceLoader } from "../exceptions/errorService";
import { exceptionLogger } from "../log/exceptionLogger";
import { LogServiceOnError } from "../log/logService";

window.onerror = (_event, _source, _lineno, _colno, error): unknown => {
  errorServiceLoader(error);
  LogServiceOnError.resetPath();
  return exceptionLogger(error);
};
