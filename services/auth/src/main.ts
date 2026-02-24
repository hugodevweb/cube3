import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.setGlobalPrefix('auth');

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`[Auth] Service démarré sur le port ${port}`);
}

bootstrap();
