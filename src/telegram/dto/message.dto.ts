import { Api } from 'telegram';
import { IsNotEmpty, IsString } from 'class-validator';

export class messageDTO {
  @IsNotEmpty()
  @IsString()
  peer: Api.TypeEntityLike;
  @IsNotEmpty()
  @IsString()
  message: string;
}
