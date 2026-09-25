import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from '../entities/user.entity.js';
import { UserContactEntity } from '../entities/user-contact.entity.js';

export interface AuthUserSnapshot {
  id: string;
  name: string;
  email: string;
  role?: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(UserContactEntity) private readonly contactsRepository: Repository<UserContactEntity>,
  ) {}

  async syncFromAuth(user: AuthUserSnapshot): Promise<UserEntity> {
    const role = user.role === UserRole.CREATOR ? UserRole.CREATOR : UserRole.BUYER;
    const email = user.email.trim().toLowerCase();
    const name = user.name.trim() || email.split('@')[0];
    const shareCode = this.makeShareCode(user.id);
    // Google users are created first in neon_auth. This upsert immediately
    // materializes the corresponding domain identity and is safe to repeat.
    await this.usersRepository.upsert({ id: user.id, name, email, role, shareCode }, ['id']);
    return this.usersRepository.findOneByOrFail({ id: user.id });
  }

  async getNetwork(userId: string): Promise<{ shareCode: string; contacts: UserEntity[] }> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User profile not found');
    if (!user.shareCode) {
      user.shareCode = this.makeShareCode(user.id);
      await this.usersRepository.save(user);
    }
    return { shareCode: user.shareCode, contacts: await this.getContacts(userId) };
  }

  async linkContact(userId: string, code: string): Promise<UserEntity> {
    const contact = await this.usersRepository.findOneBy({ shareCode: code.trim().toUpperCase() });
    if (!contact) throw new NotFoundException('Contact code not found');
    if (contact.id === userId) throw new BadRequestException('You cannot link your own code');
    const existing = await this.contactsRepository.findOneBy({ userId, contactId: contact.id });
    if (!existing) {
      await this.contactsRepository.save(this.contactsRepository.create({ userId, contactId: contact.id }));
      await this.contactsRepository.save(this.contactsRepository.create({ userId: contact.id, contactId: userId }));
    }
    return contact;
  }

  async getContacts(userId: string): Promise<UserEntity[]> {
    const links = await this.contactsRepository.find({ where: { userId } });
    if (!links.length) return [];
    return this.usersRepository.findByIds(links.map((link) => link.contactId));
  }

  async isContact(userId: string, contactId: string): Promise<boolean> {
    return Boolean(await this.contactsRepository.findOneBy({ userId, contactId }));
  }

  private makeShareCode(id: string): string {
    return `KMP-${id.replace(/-/g, '').slice(0, 5).toUpperCase()}`;
  }
}
