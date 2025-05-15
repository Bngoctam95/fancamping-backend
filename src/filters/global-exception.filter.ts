import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Định nghĩa interface cho response từ exception
interface ExceptionResponse {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  message_key?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Mặc định status code 500
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let message_key: string = 'error.internal';

    // Xác định status code phù hợp từ exception
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const errorResponse = exception.getResponse() as ExceptionResponse;

      // Lấy message và message_key từ exception
      message =
        typeof errorResponse === 'object'
          ? Array.isArray(errorResponse.message)
            ? errorResponse.message[0]
            : errorResponse.message || exception.message
          : String(errorResponse);

      message_key =
        typeof errorResponse === 'object' && errorResponse.message_key
          ? errorResponse.message_key
          : 'error.unknown';
    }

    // Log lỗi để debug
    console.error('Exception:', {
      exception: exception instanceof Error ? exception.name : 'Unknown error',
      message:
        exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : 'No stack trace',
      path: request.url,
    });

    // Trả về cùng một cấu trúc với API thành công
    response.status(statusCode).json({
      statusCode: statusCode,
      message: message,
      message_key: message_key,
      data: null,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
