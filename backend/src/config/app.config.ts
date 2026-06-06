import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8000', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  globalPrefix: 'api',
}));
