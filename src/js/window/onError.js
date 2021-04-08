import { errorServiceLoader } from "../exceptions/errorService";
import { exceptionLogger } from "../log/exceptionLogger";
window.onerror = function (_event, _source, _lineno, _colno, error) {
    errorServiceLoader(error);
    return exceptionLogger(error);
};
