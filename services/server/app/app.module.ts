import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { validateConfig } from '@const';
import { ConfigModule } from '@nestjs/config';
import { RequestIdMiddleware } from '@middlewares/request-id.middleware';
import { HttpMiddleware } from '@middlewares/http.middleware';
import { ServiceModule } from '@api/service/service.module';
import { resolve } from 'node:path';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: resolve('../../', '.env'),
      validate: validateConfig,
      isGlobal: true,
    }),
    ServiceModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, HttpMiddleware).forRoutes('*');
  }
}
