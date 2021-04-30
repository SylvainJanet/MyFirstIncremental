import { LogLevel } from "typescript-logging";
import { Log } from "./config";

const path: string[] = [];

const getPrefix = (): string => {
  let result = "";
  path.forEach(() => {
    result += ".";
  });
  if (path.length !== 0) {
    result = `${result}`;
  }
  return result;
};

const logLevelPaths = LogLevel.Debug;

export const LogServiceOnError = {
  resetPath(): void {
    path.length = 0;
  },
};

export const LogService = {
  addLevel(name: string): void {
    this.log(logLevelPaths, `*${name}*`, null);
    path.push(name);
  },
  removeLevelVoid(): void {
    const name = path.pop();
    this.log(logLevelPaths, `> end ${String(name)} : OK`, null);
  },
  removeLevelError(error: Error | (() => Error | null) | null): void {
    const name = path.pop();
    this.log(LogLevel.Error, `> end ${String(name)} : error`, error);
  },
  removeLevelResultObject(object: unknown): void {
    const name = path.pop();
    this.log(logLevelPaths, `> end ${String(name)} : result ${JSON.stringify(object)}`, null);
  },
  removeLevelResultPrimitive(object: unknown): void {
    const name = path.pop();
    this.log(logLevelPaths, `> end ${String(name)} : result ${String(object)}`, null);
  },
  log(logLevel: LogLevel, message: string, error: Error | (() => Error | null) | null): void {
    Log.log(logLevel, getPrefix() + message, error);
  },
};
