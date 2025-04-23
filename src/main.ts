import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AdminService } from './modules/users/admin.service';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  // Create default admin
  const adminService = app.get(AdminService);
  await adminService.createDefaultAdmin();

  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
