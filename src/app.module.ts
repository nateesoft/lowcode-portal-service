import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { FlowsModule } from './modules/flows/flows.module';
import { AuthModule } from './modules/auth/auth.module';
import { NodeContentModule } from './modules/node-content/node-content.module';
import { ComponentsModule } from './modules/components/components.module';
import { PagesModule } from './modules/pages/pages.module';
import { MyProjectsModule } from './modules/my-projects/my-projects.module';
import { NotesModule } from './modules/notes/notes.module';
import { ServicesModule } from './modules/services/services.module';
import { UserGroupsModule } from './modules/user-groups/user-groups.module';
import { SecretKeysModule } from './modules/secret-keys/secret-keys.module';
import { DatabaseModule } from './modules/database.module';
import { MediaModule } from './modules/media/media.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        schema: configService.get('DATABASE_SCHEMA'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    FlowsModule,
    AuthModule,
    NodeContentModule,
    ComponentsModule,
    PagesModule,
    MyProjectsModule,
    NotesModule,
    ServicesModule,
    UserGroupsModule,
    SecretKeysModule,
    DatabaseModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
