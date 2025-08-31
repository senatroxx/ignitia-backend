/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response, NextFunction } from "express";
import { plainToClass } from "class-transformer";
import {
  validate,
  ValidationError,
  type ValidatorOptions,
} from "class-validator";
import {
  type Schema,
  type ValidationResult,
  ValidationError as JoiValidationError,
} from "joi";

import { ErrorHandler, HttpResponse } from "@config/http";
import { HTTPCode } from "@constant/http.constant";

type TClassConstructor<T> = {
  new (): T;
};

type TErrorResponse = {
  field: string;
  message: string;
};

export type TQueryValidatorOptions = {
  throwError?: boolean;
};

export class ValidationMiddleware {
  static validateBody<T extends object>(
    type: TClassConstructor<T>,
    validatorOptions?: ValidatorOptions
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const validationObj = plainToClass(type, req.body);
      const errors: ValidationError[] = await validate(
        validationObj,
        validatorOptions
      );

      if (errors.length > 0) {
        HttpResponse.error(
          res,
          "Validation Error",
          ValidationMiddleware.formatBodyErrors(errors),
          HTTPCode.ValidationError
        );
      } else {
        req.body = validationObj;
        next();
      }
    };
  }

  private static formatBodyErrors(errors: ValidationError[]): TErrorResponse[] {
    const formattedErrors: TErrorResponse[] = [];

    const extractErrors = (error: ValidationError, parentField = "") => {
      const { property, constraints, children } = error;
      const field = parentField ? `${parentField}.${property}` : property;

      if (constraints) {
        formattedErrors.push({
          field,
          message: constraints[Object.keys(constraints).pop() as string],
        });
      }

      if (children && children.length > 0) {
        children.forEach((child) => extractErrors(child, field));
      }
    };

    errors.forEach((error) => extractErrors(error));

    return formattedErrors;
  }

  static validateQuery<T>(
    query: unknown,
    schema: Schema,
    options: TQueryValidatorOptions = { throwError: true }
  ): T {
    const validationResult: ValidationResult<T> = schema.validate(query, {
      abortEarly: false,
    });

    const { error, value: result }: { error: JoiValidationError; value: T } =
      validationResult;

    if (options.throwError && error) {
      throw new ErrorHandler(
        "Validation Error",
        ValidationMiddleware.formatQueryErrors(error),
        HTTPCode.ValidationError
      );
    }

    return result;
  }

  private static formatQueryErrors(
    errors: JoiValidationError
  ): TErrorResponse[] {
    return errors.details.map((error) => {
      const { context, message } = error;

      return {
        field: context.key,
        message: message.replace(
          /"(\w+)"/,
          (match, p1) => p1.charAt(0).toUpperCase() + p1.slice(1)
        ),
      };
    });
  }
}
