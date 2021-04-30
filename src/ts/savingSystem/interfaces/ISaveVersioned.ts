import type { SavingVersion } from "../SavingVersion";
import { LogLevel } from "typescript-logging";
import { LogService } from "../../log/logService";

export interface ISaveVersioned {
  version: SavingVersion;
}

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const isSaveVersioned = (object: any): object is ISaveVersioned => {
  LogService.addLevel("isSaveVersioned");
  LogService.log(LogLevel.Trace, "Object is being type checked : ISaveVersioned ?", null);
  LogService.log(LogLevel.Trace, JSON.stringify(object), null);
  const result: boolean =
    object !== null &&
    object !== null &&
    typeof object !== "undefined" &&
    typeof object.version !== "undefined" &&
    typeof object.version === "number";
  LogService.removeLevelResultPrimitive(result);
  return result;
};
