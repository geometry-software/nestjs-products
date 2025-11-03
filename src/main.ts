import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api'); // <— важный префикс
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`Auth listening on http://localhost:${port}/api`);
}
bootstrap();
