import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().port().default(8000),
  CORS_ORIGIN: Joi.string().default('*'),

  DB_HOST: Joi.string().required().messages({
    'any.required': 'DB_HOST is required',
  }),
  DB_PORT: Joi.number().port().default(3306),
  DB_USERNAME: Joi.string().required().messages({
    'any.required': 'DB_USERNAME is required',
  }),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_DATABASE: Joi.string().required().messages({
    'any.required': 'DB_DATABASE is required',
  }),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  DB_CONNECTION_LIMIT: Joi.number().integer().min(1).default(10),

  JWT_SECRET: Joi.string().min(16).required().messages({
    'any.required': 'JWT_SECRET is required',
    'string.min': 'JWT_SECRET must be at least 16 characters long',
  }),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  DEFAULT_ADMIN_USERNAME: Joi.string().default('admin'),
  DEFAULT_ADMIN_PASSWORD: Joi.string().default('admin123'),

  PUBLIC_APP_TITLE: Joi.string().default('实验室动物信息管理系统'),
  PUBLIC_ENABLE_REGISTRATION: Joi.boolean().default(false),
  PUBLIC_ENABLE_EXPERIMENTS: Joi.boolean().default(true),
  PUBLIC_ENABLE_HEALTH_RECORDS: Joi.boolean().default(true),
  PUBLIC_ENABLE_FEEDING_RECORDS: Joi.boolean().default(true),
  PUBLIC_MAINTENANCE_MODE: Joi.boolean().default(false),
  PUBLIC_ANNOUNCEMENT: Joi.string().allow('').default(''),
});
