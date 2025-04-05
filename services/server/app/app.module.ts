import { ConfigModule, ConfigService } from '@nestjs/config';
import { MiddlewareConsumer, Module, NestModule, OnApplicationShutdown } from '@nestjs/common';
import { ValidatedConfig, validateConfig } from './const';
import { TypeOrmModule } from '@nestjs/typeorm';
import { resolve } from 'node:path';
import { AuthModule } from './modules/auth/auth.module';
import { HttpLoggerModule } from './modules/http-logger/http-logger.module';
import { ServiceModule } from './api/service/service.module';
import { RequestIdMiddleware } from './middlewares/request-id.middleware';
import { EventsModule } from './modules/events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: resolve('../../', '.env'),
      validate: validateConfig,
      isGlobal: true,
    }),
    HttpLoggerModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<ValidatedConfig, true>) => {
        const dbConfig = configService.get('db', { infer: true });
        const isDev = configService.get('isDev', { infer: true });
        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.name,
          entities: [resolve(__dirname, './db/entities/**/*.entity{.ts,.js}')],
          migrations: [resolve(__dirname, './db/migrations/**/*{.ts,.js}')],
          migrationsRun: true,
          autoLoadEntities: true,
          logging: isDev,
        };
      },
      inject: [ConfigService],
    }),
    ServiceModule,
    AuthModule,
    EventsModule,
  ],
})
export class AppModule implements NestModule, OnApplicationShutdown {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }

  onApplicationShutdown(signal?: string) {
    console.log('Received shutdown signal', signal);
  }
}
