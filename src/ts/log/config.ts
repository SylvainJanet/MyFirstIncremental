import {
  Category,
  CategoryConfiguration,
  CategoryLogFormat,
  CategoryServiceFactory,
  DateFormat,
  DateFormatEnum,
  LoggerType,
  LogLevel,
} from "typescript-logging";

/*
 * Optionally change default settings, in this example set default logging to Info.
 * Without changing configuration, categories will log to Error.
 */
// CategoryServiceFactory.setDefaultConfiguration(new CategoryConfiguration(LogLevel.Trace));
const showTimeStamp = false;
const showCategoryName = false;
CategoryServiceFactory.setDefaultConfiguration(
  new CategoryConfiguration(
    LogLevel.Trace,
    LoggerType.Console,
    new CategoryLogFormat(new DateFormat(DateFormatEnum.YearMonthDayTime, "-"), showTimeStamp, showCategoryName)
  )
);

// Create categories, they will autoregister themselves, one category without parent (root) and a child category.
export const Log = new Category("log");

/*
 * Optionally get a logger for a category, since 0.5.0 this is not necessary anymore, you can use the category itself to log.
 * export const log: CategoryLogger = CategoryServiceFactory.getLogger(cat);
 */
