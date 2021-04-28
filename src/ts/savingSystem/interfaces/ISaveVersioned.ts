import { Log } from "./../../log/config";
import type { SavingVersion } from "../SavingVersion";
import { LogLevel } from "typescript-logging";

export interface ISaveVersioned {
  version: SavingVersion;
}

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const isSaveVersioned = (object: any): object is ISaveVersioned => {
  Log.log(LogLevel.Trace, "***** isSaveVersioned *****", null);
  Log.log(LogLevel.Trace, "Object is being type checked : ISaveVersioned ?", null);
  Log.log(LogLevel.Trace, JSON.stringify(object), null);
  const result: boolean =
    object !== null &&
    object !== null &&
    typeof object !== "undefined" &&
    typeof object.version !== "undefined" &&
    typeof object.version === "number";
  Log.log(LogLevel.Trace, `===== result : ${String(result)}`, null);
  return result;
};
