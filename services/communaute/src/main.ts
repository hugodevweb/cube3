import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Consume order events from the vente service
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://maison:changeme@rabbitmq:5672'],
      queue: 'orders_queue',
      queueOptions: { durable: true },
      noAck: false,
    },
  });

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

  await app.startAllMicroservices();

  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  console.log(`[Communauté] Service démarré sur le port ${port}`);
}

bootstrap();
