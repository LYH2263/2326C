import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('config')
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('public')
  @ApiOperation({ summary: '获取公开配置信息' })
  getPublicConfig() {
    return {
      appTitle: this.configService.get<string>('public.appTitle'),
      featureFlags: {
        enableRegistration: this.configService.get<boolean>('public.enableRegistration'),
        enableExperiments: this.configService.get<boolean>('public.enableExperiments'),
        enableHealthRecords: this.configService.get<boolean>('public.enableHealthRecords'),
        enableFeedingRecords: this.configService.get<boolean>('public.enableFeedingRecords'),
      },
      maintenanceMode: this.configService.get<boolean>('public.maintenanceMode'),
      announcement: this.configService.get<string>('public.announcement'),
      env: this.configService.get<string>('app.nodeEnv'),
    };
  }
}
