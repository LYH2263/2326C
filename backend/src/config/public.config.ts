import { registerAs } from '@nestjs/config';

export default registerAs('public', () => ({
  appTitle: process.env.PUBLIC_APP_TITLE || '实验室动物信息管理系统',
  enableRegistration: process.env.PUBLIC_ENABLE_REGISTRATION === 'true',
  enableExperiments: process.env.PUBLIC_ENABLE_EXPERIMENTS !== 'false',
  enableHealthRecords: process.env.PUBLIC_ENABLE_HEALTH_RECORDS !== 'false',
  enableFeedingRecords: process.env.PUBLIC_ENABLE_FEEDING_RECORDS !== 'false',
  maintenanceMode: process.env.PUBLIC_MAINTENANCE_MODE === 'true',
  announcement: process.env.PUBLIC_ANNOUNCEMENT || '',
}));
