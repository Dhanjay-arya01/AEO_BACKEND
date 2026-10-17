import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/siteup',
  jwtSecret: process.env.JWT_SECRET || 'siteup_default_secret_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  rabbitMqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  auditQueue: process.env.RABBITMQ_AUDIT_QUEUE || 'audit.jobs',
};

export const {
  port: PORT,
  nodeEnv: NODE_ENV,
  corsOrigin: CORS_ORIGIN,
  mongoUri: MONGO_URI,
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: JWT_EXPIRES_IN,
  rabbitMqUrl: RABBITMQ_URL,
  auditQueue: RABBITMQ_AUDIT_QUEUE,
} = env;

export default env;