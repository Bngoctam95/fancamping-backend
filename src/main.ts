import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AdminService } from './modules/users/admin.service';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Sử dụng cookie-parser middleware
  app.use(cookieParser());

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Chỉ cho phép các properties được định nghĩa trong DTO
      transform: true, // Tự động transform types
      forbidNonWhitelisted: true, // Throw error nếu có properties không được định nghĩa
    }),
  );

  // Áp dụng Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Cấu hình phục vụ static files cho thư mục uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Create default admin
  const adminService = app.get(AdminService);
  await adminService.createDefaultAdmin();

  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
