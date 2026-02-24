import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  app.setGlobalPrefix('vente');

  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  console.log(`[Vente] Service démarré sur le port ${port}`);
}

bootstrap();
