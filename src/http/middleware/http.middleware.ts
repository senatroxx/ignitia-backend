import type { NextFunction, Request, Response } from "express";
import { format } from "url";

import { ErrorHandler, HttpResponse } from "@config/http";
import { HTTPMessage } from "@constant/http.constant";
import LoggerManager from "@utilities/logger";

export class HTTPMiddleware {
  private appLogger = LoggerManager.getInstance().get("app");

  constructor() {}

  private urlFormatter(request: Request): string {
    return format({
      protocol: request.protocol,
      host: request.get("host"),
      pathname: request.originalUrl,
    });
  }

  public request(req: Request, _res: Response, next: NextFunction): void {
    const formattedUrl = this.urlFormatter(req);
    const ip =
      req.headers?.forwarded?.split(",").shift() || req.socket?.remoteAddress;

    this.appLogger.info({
      message: req.method,
      meta: { url: formattedUrl, ip },
    });

    next();
  }

  public error(
    err: ErrorHandler,
    _req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const httpCode = err.status || 500;
    const messageError = err.message || HTTPMessage.ServerError;

    if (["3", "4"].includes(String(httpCode).charAt(0)))
      this.appLogger.warn(messageError);
    else this.appLogger.error(messageError);

    HttpResponse.error(res, messageError, err.data || null, httpCode);
    next();
  }

  public requestHandler = (req: Request, res: Response, next: NextFunction) =>
    this.request(req, res, next);

  public errorHandler = (
    err: ErrorHandler,
    req: Request,
    res: Response,
    next: NextFunction
  ) => this.error(err, req, res, next);
}
