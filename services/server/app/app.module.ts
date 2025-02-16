import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ValidatedConfig, validateConfig } from '@const';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RequestIdMiddleware } from '@middlewares/request-id.middleware';
import { HttpMiddleware } from '@middlewares/http.middleware';
import { ServiceModule } from '@api/service/service.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { resolve } from 'node:path';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: resolve('../../', '.env'),
      validate: validateConfig,
      isGlobal: true,
    }),
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
          entities: [resolve(__dirname, '../db/entities/**/*.entity{.ts,.js}')],
          migrations: [resolve(__dirname, '../db/migrations/**/*{.ts,.js}')],
          migrationsRun: true,
          autoLoadEntities: true,
          logging: isDev,
          synchronize: isDev,
        };
      },
      inject: [ConfigService],
    }),
    ServiceModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, HttpMiddleware).forRoutes('*');
  }
}
