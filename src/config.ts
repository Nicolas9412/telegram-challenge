import { registerAs } from '@nestjs/config';

export default registerAs('config', () => {
  return {
    APIKEY: process.env.APIKEY,
    AUTHDOMAIN: process.env.AUTHDOMAIN,
    PROJECTID: process.env.PROJECTID,
    STORAGEBUCKET: process.env.STORAGEBUCKET,
    MESSAGINGSENDERID: process.env.MESSAGINGSENDERID,
    APPID: process.env.APPID,
    APPID_TELEGRAM: process.env.APPID_TELEGRAM,
    APIHASH_TELEGRAM: process.env.APIHASH_TELEGRAM,
    PORT: process.env.PORT,
  };
});
