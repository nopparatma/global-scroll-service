import { cleanEnv, str, port, url } from 'envalid';
import dotenv from 'dotenv';

dotenv.config();

export const env = cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'test', 'production', 'staging'] }),
    PORT: port({ default: 3000 }),
    REDIS_URL: url(),
    DATABASE_URL: url(),
});
