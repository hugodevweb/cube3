import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.setGlobalPrefix('auth');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Auth Service')
    .setDescription('Authentification via Keycloak — login, logout, refresh, me')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('auth/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`[Auth] Service démarré sur le port ${port}`);
}

bootstrap();
