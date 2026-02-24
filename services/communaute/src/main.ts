import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('communaute');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Communauté Service')
    .setDescription('Forum — posts, commentaires et likes')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('communaute/docs', app, document);

  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  console.log(`[Communauté] Service démarré sur le port ${port}`);
}

bootstrap();
