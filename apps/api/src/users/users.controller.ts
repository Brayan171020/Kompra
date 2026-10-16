import { Body, Controller, Get, Post, Version } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthSession } from '../auth/auth.js';
import { UsersService } from './users.service.js';
import { LinkContactDto } from './dto/link-contact.dto.js';
import { InviteBuyerDto } from './dto/invite-buyer.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../entities/user.entity.js';
import { ApiErrorResponseDto, BuyerInvitationResponseDto, ContactSummaryDto, ContactsNetworkResponseDto, CurrentUserResponseDto } from '../common/openapi/response-models.dto.js';

@ApiTags('Usuarios y contactos')
@ApiBearerAuth('bearer')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Version('1')
  @ApiOperation({ summary: 'Consultar mi perfil', description: 'Sincroniza el perfil de Better Auth con Kompra y devuelve los datos básicos del usuario y su sesión.' })
  @ApiOkResponse({ description: 'Perfil y metadatos de sesión.', type: CurrentUserResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  async me(@CurrentUser() user: AuthSession['user']): Promise<CurrentUserResponseDto> {
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
  @ApiOperation({ summary: 'Consultar mi código para compartir', description: 'Devuelve el código para vincular contactos, la lista de contactos y el rol actual.' })
  @ApiOkResponse({ description: 'Código de vinculación y contactos.', type: ContactsNetworkResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  getCode(@CurrentUser() user: AuthSession['user']) { return this.usersService.getNetwork(user.id); }

  @Get('contacts')
  @Version('1')
  @ApiOperation({ summary: 'Listar mis contactos', description: 'Devuelve los usuarios que el usuario autenticado ha vinculado.' })
  @ApiOkResponse({ description: 'Contactos vinculados.', type: ContactSummaryDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  getContacts(@CurrentUser() user: AuthSession['user']) { return this.usersService.getContacts(user.id); }

  @Post('contacts/link')
  @Version('1')
  @ApiOperation({ summary: 'Vincular un contacto', description: 'Vincula el usuario propietario de un código de compartir válido a la red del usuario actual.' })
  @ApiCreatedResponse({ description: 'Contacto vinculado.', type: ContactSummaryDto })
  @ApiBadRequestResponse({ description: 'El código de compartir no cumple el formato esperado.', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiConflictResponse({ description: 'El código es propio o el contacto ya está vinculado.', type: ApiErrorResponseDto })
  linkContact(@Body() dto: LinkContactDto, @CurrentUser() user: AuthSession['user']) { return this.usersService.linkContact(user.id, dto.code); }

  @Post('buyer-invitations')
  @Version('1')
  @Roles(UserRole.CREATOR)
  @ApiOperation({ summary: 'Invitar a un comprador', description: 'Envía una invitación por correo para que un usuario BUYER se una a Kompra. Requiere el rol CREATOR.' })
  @ApiCreatedResponse({ description: 'Invitación creada.', type: BuyerInvitationResponseDto })
  @ApiBadRequestResponse({ description: 'La dirección de correo no es válida.', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'La sesión falta o no es válida.', type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Solo un usuario CREATOR puede invitar compradores.', type: ApiErrorResponseDto })
  @ApiConflictResponse({ description: 'El destinatario ya forma parte de Kompra o ya tiene una invitación activa.', type: ApiErrorResponseDto })
  inviteBuyer(@Body() dto: InviteBuyerDto, @CurrentUser() user: AuthSession['user']) {
    return this.usersService.inviteBuyer(user.id, dto.email);
  }
}
