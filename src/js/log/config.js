import { Category, CategoryConfiguration, CategoryServiceFactory, LogLevel } from "typescript-logging";
CategoryServiceFactory.setDefaultConfiguration(new CategoryConfiguration(LogLevel.Trace));
export var Log = new Category("log");
