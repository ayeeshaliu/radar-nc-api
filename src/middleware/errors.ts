import { ValidationError } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ExpressErrorMiddlewareInterface, HttpError, Middleware } from 'routing-controllers';
import { Service } from 'typedi';

@Service()
@Middleware({ type: 'after' })
export default class AppErrorHandler implements ExpressErrorMiddlewareInterface {
  error(error: unknown, request: Request, response: Response, _: NextFunction): void {
    handleError(request, response, error);
  }
}

export function handleError(request: Request, response: Response, error: unknown): void {
  if (error instanceof HttpError) {
    handleHttpError(request, response, error);
    return;
  }

  request.logger?.error('Unexpected error occurred', error);
  response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: 'error',
    message: 'An error occurred while processing your request',
  });
}

function handleHttpError(request: Request, response: Response, error: HttpError): void {
  request.logger?.error('HTTP Error occurred', error);
  if (hasValidationErrors(error)) {
    response.status(error.httpCode).json(handleValidationErrors(error));
    return;
  }

  response.status(error.httpCode).json({
    status: 'error',
    message: error.message,
  });
}

function handleValidationErrors(error: HasValidationErrors) {
  return {
    status: 'error',
    message: 'Invalid payload',
    errors: error.errors.map((e) => ({
      field: e.property,
      message: Object.values(e.constraints || {}).join(', '),
    })),
  };
}

type HasValidationErrors = { errors: ValidationError[] };
function hasValidationErrors(error: object): error is HasValidationErrors {
  return (
    'errors' in error && Array.isArray(error.errors) && error.errors[0] instanceof ValidationError
  );
}
