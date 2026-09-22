import { Body, Controller, Get, Post, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthSession } from '../auth/auth.js';
import { UsersService } from './users.service.js';
import { LinkContactDto } from './dto/link-contact.dto.js';

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

  @Get('me/code')
  @Version('1')
  getCode(@CurrentUser() user: AuthSession['user']) { return this.usersService.getNetwork(user.id); }

  @Get('contacts')
  @Version('1')
  getContacts(@CurrentUser() user: AuthSession['user']) { return this.usersService.getContacts(user.id); }

  @Post('contacts/link')
  @Version('1')
  linkContact(@Body() dto: LinkContactDto, @CurrentUser() user: AuthSession['user']) { return this.usersService.linkContact(user.id, dto.code); }
}

interface UserEntityResponse { id: string; name: string; email: string; role: string; createdAt: Date }
interface SessionResponse { userId: string }
