import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const payload = this.normalizeHttpException(exceptionResponse);
      response.status(status).json(payload);
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error'
    });
  }

  private normalizeHttpException(exceptionResponse: string | object) {
    if (typeof exceptionResponse === 'string') {
      return {
        errorCode: 'HTTP_EXCEPTION',
        message: exceptionResponse
      };
    }

    const record = exceptionResponse as Record<string, unknown>;
    const message = record.message;
    const details = Array.isArray(message) ? { validationErrors: message } : record.details;

    return {
      errorCode: typeof record.errorCode === 'string' ? record.errorCode : 'HTTP_EXCEPTION',
      message: typeof message === 'string' ? message : 'Request failed',
      ...(details ? { details } : {})
    };
  }
}
