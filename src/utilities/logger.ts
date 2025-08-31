import {
  Logger,
  type LoggerOptions,
  createLogger,
  format,
  transports,
} from "winston";
import { type TransformableInfo } from "logform";
import Datetime from "./datetime";

interface TransformableInfoWithMeta extends TransformableInfo {
  meta?: { [key: string]: string };
}

export default class LoggerManager {
  private static instance: LoggerManager;
  private loggers: Map<string, Logger> = new Map();

  constructor() {}

  public static getInstance(): LoggerManager {
    if (!LoggerManager.instance) LoggerManager.instance = new LoggerManager();

    return LoggerManager.instance;
  }

  private winstonFormat = format.printf(
    ({ level, message, meta }: TransformableInfoWithMeta) => {
      const timestamp = Datetime.log();
      const formattedMessage = `${timestamp} [${level}]: `;

      if (meta) {
        if (meta.url) message = `[${message}] ${meta.url}`;
        if (meta.from_ip) message = `${meta.from_ip} | ${message}`;
      }

      return formattedMessage + message;
    }
  );

  private winstonConfig: LoggerOptions = {
    format: format.combine(format.colorize({ all: true }), this.winstonFormat),
  };

  public create(name: string, level: string = "info"): Logger {
    if (this.loggers.has(name)) return this.loggers.get(name);

    const logger = createLogger({
      level,
      transports: [new transports.Console()],
      format: this.winstonConfig.format,
    });

    this.loggers.set(name, logger);
    return logger;
  }

  public get(name: string): Logger {
    return this.loggers.get(name) || this.create(name);
  }
}
