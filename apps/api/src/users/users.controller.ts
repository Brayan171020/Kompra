import { Controller, Get, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthSession } from '../auth/auth.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Version('1')
  @ApiOperation({ summary: 'Returns the authenticated profile and session metadata' })
  @ApiResponse({ status: 200, description: 'Authenticated user profile' })
  @ApiResponse({ status: 401, description: 'Missing or invalid session' })
  async me(@CurrentUser() user: AuthSession['user']): Promise<{ user: UserEntityResponse; session: SessionResponse }> {
    const profile = await this.usersService.syncFromAuth({
      id: user.id,
      name: user.name,
      email: user.email,
      role: typeof user.role === 'string' ? user.role : undefined,
    });
    return {
      user: { id: profile.id, name: profile.name, email: profile.email, role: profile.role, createdAt: profile.createdAt },
      session: { userId: profile.id },
    };
  }
}

interface UserEntityResponse { id: string; name: string; email: string; role: string; createdAt: Date }
interface SessionResponse { userId: string }
