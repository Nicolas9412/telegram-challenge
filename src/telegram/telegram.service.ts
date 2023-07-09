import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import config from '../config';
import { ConfigType } from '@nestjs/config';
import input from 'input';
import { messageDTO } from './dto/message.dto';
import { FirebaseService } from 'src/firebase/firebase.service';
import {
  collection,
  getDocs,
  setDoc,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { Message } from './interfaces/message.interface';

@Injectable()
export class TelegramService {
  public client: TelegramClient;
  public stringSession: StringSession;
  public me: Api.User;
  constructor(
    @Inject(config.KEY)
    private readonly configService: ConfigType<typeof config>,
    private readonly firebaseService: FirebaseService,
  ) {
    this.stringSession = new StringSession(
      '1AQAOMTQ5LjE1NC4xNzUuNTMBu5F1AFOizHsrykwQjxloMHVig3XBOpGmYYpMADsF1KTeJfydRQStnK0G0AUdSfl6n+cx81G+9PjvuwDF5Ly0VMrZhouVkMcUd68r7KG9NwS9eVUL8Zbve/uIdLUQK2inNePlgVx1Q+kxqVBnlVbG8FsHj/juWRFrYuP2gAnQq+iW1q1YpFyybRbS1VNQhWjadQSkufrgbCSXEe5tSx5DQG6skBebIgeFMPAwGEiBkxPq1xNGdS+h1HuvERz2ArDn75dogPyEG5OFIuPjydAtRBTjhru7ZT2/refqFdHmzh1T43QTyvo72/9tA4uuOhS+xJ5MSLaLHvHjibqxUSmc6Lk=',
    );
    this.client = new TelegramClient(
      this.stringSession,
      +this.configService.APPID_TELEGRAM,
      this.configService.APIHASH_TELEGRAM,
      {
        connectionRetries: 5,
      },
    );
    this.startClient();
  }

  private async startClient() {
    if (!(await this.client.isUserAuthorized())) {
      await this.client.start({
        phoneNumber: async () => await input.text('Please enter your number: '),
        password: async () => await input.text('Please enter your password: '),
        phoneCode: async () =>
          await input.text('Please enter the code you received: '),
        onError: (err) => console.log(err),
      });
      this.stringSession.save();
      this.me = (await this.client.getMe()).originalArgs as Api.User;
      const isExistsUser = await getDoc(
        doc(this.firebaseService.firestore, 'users', this.me.phone),
      );
      if (!isExistsUser) {
        await setDoc(
          doc(this.firebaseService.firestore, 'users', this.me.phone),
          {},
        );
      }
      console.log('You should now be connected.');
    } else {
      await this.client.connect();
    }
  }

  public async sendMessage(messageDTO: messageDTO): Promise<Message> {
    try {
      const result: Api.TypeUpdates = (await this.client.invoke(
        new Api.messages.SendMessage({
          peer: messageDTO.peer,
          message: messageDTO.message,
          noWebpage: true,
          noforwards: true,
        }),
      )) as Api.UpdateShortSentMessage;

      const newMessage = {
        datetimeCreated: result.date,
        message: messageDTO.message,
      };
      const newDoc = doc(
        this.firebaseService.firestore,
        `users/${this.me.phone}/${messageDTO.peer}`,
        result.id.toString(),
      );
      await setDoc(newDoc, newMessage);
      return { id: result.id.toString(), ...newMessage };
    } catch (error) {
      if (error.errorMessage == 'AUTH_KEY_UNREGISTERED')
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
  public async getMessages(phone: string) {
    try {
      if (!this.me) throw 'Not authorizated';
      const docRef = collection(
        this.firebaseService.firestore,
        `users/${this.me.phone}/${phone}`,
      );
      const docsSnap = await getDocs(docRef);
      const messages: Message[] = [];
      docsSnap.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Message);
      });
      if (messages.length === 0) throw new Error('Not found messages');
      return messages;
    } catch (error) {
      if (error == 'Not authorizated')
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
  public async deleteMessage(phone: string, idMessage: string) {
    try {
      await this.client.invoke(
        new Api.messages.DeleteMessages({
          id: [+idMessage],
          revoke: true,
        }),
      );
      const docRef = doc(
        this.firebaseService.firestore,
        `users/${this.me.phone}/${phone}`,
        idMessage.toString(),
      );
      await deleteDoc(docRef);
    } catch (error) {
      if (error.errorMessage == 'AUTH_KEY_UNREGISTERED')
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  public async editMessage(
    idMessage: string,
    messageDTO: messageDTO,
  ): Promise<Message> {
    try {
      const result = (await this.client.invoke(
        new Api.messages.EditMessage({
          peer: messageDTO.peer,
          id: +idMessage,
          noWebpage: true,
          message: messageDTO.message,
        }),
      )) as Api.UpdateShortSentMessage;

      const messageUpdated = {
        datetimeUpdated: result.date,
        message: messageDTO.message,
      };
      const docRef = doc(
        this.firebaseService.firestore,
        `users/${this.me.phone}/${messageDTO.peer}`,
        idMessage.toString(),
      );
      const docSnap = await getDoc(docRef);
      const messageFound = { id: docSnap.id, ...docSnap.data() } as Message;
      await updateDoc(docRef, messageUpdated);
      return {
        id: idMessage,
        message: messageDTO.message,
        datetimeCreated: messageFound.datetimeCreated,
        datetimeUpdated: result.date,
      };
    } catch (error) {
      if (error.errorMessage == 'AUTH_KEY_UNREGISTERED')
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      if (
        error.errorMessage == 'MESSAGE_ID_INVALID' ||
        error.errorMessage == 'MESSAGE_NOT_MODIFIED'
      )
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  public async logout() {
    await this.client.invoke(new Api.auth.LogOut());
    this.client = new TelegramClient(
      this.stringSession,
      +this.configService.APPID_TELEGRAM,
      this.configService.APIHASH_TELEGRAM,
      {
        connectionRetries: 5,
      },
    );
    this.me = undefined;
    this.startClient();
  }
}
