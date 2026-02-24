import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { JwtStrategy } from './auth/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'postgres',
      port: +(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'maison',
      password: process.env.DB_PASSWORD ?? 'changeme',
      database: process.env.DB_NAME ?? 'maison_epouvante',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ClientsModule.register([
      {
        name: 'RABBITMQ_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL ??
              'amqp://maison:changeme@rabbitmq:5672',
          ],
          queue: 'orders_queue',
          queueOptions: { durable: true },
        },
      },
    ]),
    ProductsModule,
    OrdersModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}
