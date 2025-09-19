import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation for DTOs (like RegisterDto)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips extra fields not in DTO
      forbidNonWhitelisted: true, // throws error if unknown fields are sent
      transform: true, // auto-transform payloads into DTO classes
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
