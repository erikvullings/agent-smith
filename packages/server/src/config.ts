import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export interface IConfig {
  port: number;
  debugLogging: boolean;
}

const isDevMode = process.env.NODE_ENV == 'development';

export const config: IConfig = {
  port: +(process.env.PORT || 3000),
  debugLogging: isDevMode,
};
