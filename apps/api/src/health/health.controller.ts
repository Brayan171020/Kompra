import { Controller, Get, Version } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { HealthResponseDto } from '../common/openapi/response-models.dto.js';

@ApiTags('Salud')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Version('1')
  @Public()
  @ApiOperation({ summary: 'Consultar el estado del servicio y la base de datos' })
  @ApiOkResponse({ description: 'La API está disponible y devuelve el estado de PostgreSQL.', type: HealthResponseDto })
  @ApiResponse({ status: 503, description: 'La base de datos no está disponible.' })
  check(): Promise<HealthResponseDto> { return this.healthService.check(); }
}
