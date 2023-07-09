import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { FirebaseService } from 'src/firebase/firebase.service';

@Module({
  controllers: [TelegramController],
  providers: [TelegramService, FirebaseService],
})
export class TelegramModule {}
