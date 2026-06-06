import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AnimalsModule } from './animals/animals.module';
import { HealthModule } from './health/health.module';
import { ExperimentsModule } from './experiments/experiments.module';
import { FeedingModule } from './feeding/feeding.module';
import { StatisticsModule } from './statistics/statistics.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import authConfig from './config/auth.config';
import publicConfig from './config/public.config';
import { configValidationSchema } from './config/config.schema';
import { ConfigModule as AppConfigModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, publicConfig],
      validationSchema: configValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}.local`,
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env.local',
        '.env',
      ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        autoLoadEntities: true,
        synchronize: configService.get<boolean>('database.synchronize'),
        charset: configService.get<string>('database.charset'),
        logging: configService.get<boolean>('database.logging'),
        extra: {
          connectionLimit: configService.get<number>('database.connectionLimit'),
        },
      }),
    }),
    AuthModule,
    AnimalsModule,
    HealthModule,
    ExperimentsModule,
    FeedingModule,
    StatisticsModule,
    AppConfigModule,
  ],
})
export class AppModule {}
