import { ValidatedConfig } from '@const';
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('service')
@Controller({
  path: '/service',
})
export class ServiceController {
  constructor(private configService: ConfigService<ValidatedConfig, true>) {}

  @Get('/health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if service is healthy' })
  healthCheck() {
    return {
      healthy: true,
    };
  }

  @Get('/config')
  @HttpCode(HttpStatus.OK)
  config() {
    return this.configService.get('app', { infer: true });
  }

  @Get('/up')
  @ApiOperation({ summary: 'Check if service is up' })
  upcheck() {
    return {};
  }
}
