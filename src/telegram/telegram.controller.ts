import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  HttpCode,
} from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { messageDTO } from './dto/message.dto';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post()
  @HttpCode(201)
  async sendMessage(@Body() messageDTO: messageDTO) {
    return await this.telegramService.sendMessage(messageDTO);
  }
  @Get('/:phone')
  async getMessages(@Param('phone') phone: string) {
    const messages = await this.telegramService.getMessages(phone);
    return messages;
  }
  @Delete('/:phone/:idMessage')
  async deleteMessage(
    @Param('phone') phone: string,
    @Param('idMessage', ParseIntPipe) idMessage: string,
  ) {
    await this.telegramService.deleteMessage(phone, idMessage);
    return;
  }
  @Put('/:idMessage')
  async editMessage(
    @Param('idMessage', ParseIntPipe) idMessage: string,
    @Body() messageDTO: messageDTO,
  ) {
    return await this.telegramService.editMessage(idMessage, messageDTO);
  }

  @Post('/logout')
  async logout() {
    await this.telegramService.logout();
    return;
  }
}
