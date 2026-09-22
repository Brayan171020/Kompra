import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from '../entities/user.entity.js';

export interface AuthUserSnapshot {
  id: string;
  name: string;
  email: string;
  role?: string | null;
}

@Injectable()
export class UsersService {
  constructor(@InjectRepository(UserEntity) private readonly usersRepository: Repository<UserEntity>) {}

  async syncFromAuth(user: AuthUserSnapshot): Promise<UserEntity> {
    const role = user.role === UserRole.CREATOR ? UserRole.CREATOR : UserRole.BUYER;
    await this.usersRepository.upsert({ id: user.id, name: user.name, email: user.email, role }, ['id']);
    return this.usersRepository.findOneByOrFail({ id: user.id });
  }
}
