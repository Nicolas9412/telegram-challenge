import { Injectable, Inject } from '@nestjs/common';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  CollectionReference,
  Firestore,
  collection,
  getFirestore,
} from 'firebase/firestore';
import config from '../config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class FirebaseService {
  public app: FirebaseApp;
  public firestore: Firestore;

  //Collections
  public messages: CollectionReference;

  constructor(
    @Inject(config.KEY)
    private readonly configService: ConfigType<typeof config>,
  ) {
    this.app = initializeApp({
      apiKey: this.configService.APIKEY,
      authDomain: this.configService.AUTHDOMAIN,
      projectId: this.configService.PROJECTID,
      storageBucket: this.configService.STORAGEBUCKET,
      messagingSenderId: this.configService.MESSAGINGSENDERID,
      appId: this.configService.APPID,
    });

    this.firestore = getFirestore();

    this.createCollections();
  }

  private createCollections() {
    this.messages = collection(this.firestore, 'messages');
  }
}
