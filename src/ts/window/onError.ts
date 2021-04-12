import { errorServiceLoader } from "../exceptions/errorService";
import { exceptionLogger } from "../log/exceptionLogger";

window.onerror = (_event, _source, _lineno, _colno, error) => {
  errorServiceLoader(error);
  return exceptionLogger(error);
};
