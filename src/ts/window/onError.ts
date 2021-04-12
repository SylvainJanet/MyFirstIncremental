import { errorServiceLoader } from "../exceptions/errorService";
import { exceptionLogger } from "../log/exceptionLogger";

// // eslint-disable-next-line max-params
window.onerror = (_event, _source, _lineno, _colno, error): unknown => {
  errorServiceLoader(error);
  return exceptionLogger(error);
};
