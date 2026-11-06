import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET deve conter pelo menos 16 caracteres')
    .default('strike_house_super_secret_key_change_in_production'),
  DATA_DIR: z.string().default('data'),
  DB_FILE: z.string().default('strike_house.db'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Falha na validação das variáveis de ambiente:', parsedEnv.error.format());
  process.exit(1);
}

const env = parsedEnv.data;

export const PORT = env.PORT;
export const HOST = env.HOST;
export const JWT_SECRET = env.JWT_SECRET;
export const DATA_DIR = path.resolve(process.cwd(), env.DATA_DIR);
export const DB_PATH = path.join(DATA_DIR, env.DB_FILE);

export default {
  PORT,
  HOST,
  JWT_SECRET,
  DATA_DIR,
  DB_PATH,
};
