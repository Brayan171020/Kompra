import { Controller, Get, Version } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Comprueba el servicio y la conexión con Neon PostgreSQL' })
  check(): Promise<{ status: string; database: string; timestamp: string }> { return this.healthService.check(); }
}
