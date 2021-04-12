import { Category, CategoryConfiguration, CategoryServiceFactory, LogLevel } from "typescript-logging";
CategoryServiceFactory.setDefaultConfiguration(new CategoryConfiguration(LogLevel.Trace));
export var log = new Category("log");
