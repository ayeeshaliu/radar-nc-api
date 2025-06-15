import type { NextFunction, Request, Response } from 'express';

export default function healthcheckMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (request.url === '/healthcheck') {
    response.send('<h1>Healthcheck OK! 👍</h1>');
    return;
  }

  next();
}
