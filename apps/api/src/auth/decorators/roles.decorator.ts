import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../entities/user.entity.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator => SetMetadata(ROLES_KEY, roles);
