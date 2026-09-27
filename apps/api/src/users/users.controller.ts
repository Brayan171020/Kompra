import { Body, Controller, Get, Post, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthSession } from '../auth/auth.js';
import { UsersService } from './users.service.js';
import { LinkContactDto } from './dto/link-contact.dto.js';
import { InviteBuyerDto } from './dto/invite-buyer.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../entities/user.entity.js';

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
      emailVerified: user.emailVerified,
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

  @Post('buyer-invitations')
  @Version('1')
  @Roles(UserRole.CREATOR)
  @ApiOperation({ summary: 'Invite a buyer to Kompra by email' })
  inviteBuyer(@Body() dto: InviteBuyerDto, @CurrentUser() user: AuthSession['user']) {
    return this.usersService.inviteBuyer(user.id, dto.email);
  }
}

interface UserEntityResponse { id: string; name: string; email: string; role: string; createdAt: Date }
interface SessionResponse { userId: string }
