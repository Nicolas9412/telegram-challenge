import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { FirebaseService } from './firebase/firebase.service';
import { TelegramModule } from './telegram/telegram.module';
import config from './config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      load: [config],
      isGlobal: true,
      validationSchema: Joi.object({
        APIKEY: Joi.string().required(),
        AUTHDOMAIN: Joi.string().required(),
        PROJECTID: Joi.string().required(),
        STORAGEBUCKET: Joi.string().required(),
        MESSAGINGSENDERID: Joi.string().required(),
        APPID: Joi.string().required(),
        APPID_TELEGRAM: Joi.number().required(),
        APIHASH_TELEGRAM: Joi.string().required(),
        PORT: Joi.number().required(),
      }),
    }),
    TelegramModule,
  ],
  controllers: [AppController],
  providers: [AppService, FirebaseService],
})
export class AppModule {}
