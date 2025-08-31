import type { Response } from "express";

import { HTTPCode } from "@constant/http.constant";
import LoggerManager from "@utilities/logger";

type MetaReponseType = {
  success: boolean;
  code: HTTPCode;
  status: "success" | "error";
  message?: string;
};

type JSONResponseType = {
  meta: MetaReponseType;
  data?: object;
  errors?: object;
};

class HttpResponse {
  private static logger = LoggerManager.getInstance().get("app");

  private static getStatus(code: string) {
    code = code.charAt(0);

    let message;

    switch (code) {
      case "1":
        message = "Informational";
        break;
      case "2":
        message = "Success";
        break;
      case "3":
        message = "Redirection";
        break;
      case "4":
        message = "Client Error";
        break;
      default:
        message = "Server Error";
        break;
    }

    return message;
  }

  private static JSONResponse(
    code: HTTPCode,
    message?: string,
    data: object = null
  ) {
    const payload: JSONResponseType = {
      meta: {
        success: String(code).charAt(0) !== "2" ? false : true,
        code,
        status: this.getStatus(String(code)),
        message: message,
      },
    };

    if (data) {
      if (code === HTTPCode.ValidationError) payload.errors = data;
      else payload.data = data;
    }

    return payload;
  }

  public static success(
    res: Response,
    message: string,
    data?: object,
    code: HTTPCode = HTTPCode.Success
  ) {
    this.logger.info(message);

    return res.status(code).json(this.JSONResponse(code, message, data));
  }

  public static error(
    res: Response,
    message: string,
    data?: object,
    code: HTTPCode = HTTPCode.ClientError
  ) {
    return res.status(code).json(this.JSONResponse(code, message, data));
  }
}

class ErrorHandler extends Error {
  // public message: string;
  public data: object;
  public status: number;

  constructor(message: string, data: object = {}, status: number = 500) {
    super(message);
    this.message = message;
    this.status = status;
    this.data = data;
  }
}

export { HttpResponse, ErrorHandler };
