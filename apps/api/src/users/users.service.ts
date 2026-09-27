import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, MoreThan, Repository } from 'typeorm';
import { UserEntity, UserRole } from '../entities/user.entity.js';
import { UserContactEntity } from '../entities/user-contact.entity.js';
import { BuyerInvitationEntity } from '../entities/buyer-invitation.entity.js';

export interface AuthUserSnapshot {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  emailVerified?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(UserContactEntity) private readonly contactsRepository: Repository<UserContactEntity>,
    @InjectRepository(BuyerInvitationEntity) private readonly invitationsRepository: Repository<BuyerInvitationEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async syncFromAuth(user: AuthUserSnapshot): Promise<UserEntity> {
    const email = user.email.trim().toLowerCase();
    const name = user.name.trim() || email.split('@')[0];
    const existing = await this.usersRepository.findOneBy({ id: user.id });
    const pendingInvitations = user.emailVerified
      ? await this.invitationsRepository.find({ where: { email, acceptedAt: IsNull(), expiresAt: MoreThan(new Date()) } })
      : [];
    const role = pendingInvitations.length ? UserRole.BUYER : existing?.role ?? UserRole.CREATOR;
    const shareCode = this.makeShareCode(user.id);
    await this.usersRepository.upsert({ id: user.id, name, email, role, shareCode }, ['id']);

    for (const invitation of pendingInvitations) {
      if (invitation.creatorId !== user.id) await this.ensureContactPair(user.id, invitation.creatorId);
      invitation.acceptedAt = new Date();
      await this.invitationsRepository.save(invitation);
    }
    await this.syncNeonAuthRole(user.id, role);
    return this.usersRepository.findOneByOrFail({ id: user.id });
  }

  async inviteBuyer(creatorId: string, rawEmail: string): Promise<{ email: string; expiresAt: Date }> {
    const email = rawEmail.trim().toLowerCase();
    const creator = await this.usersRepository.findOneBy({ id: creatorId });
    if (!creator) throw new NotFoundException('Creator profile not found');
    if (creator.email.toLowerCase() === email) throw new BadRequestException('You cannot invite your own email');
    const now = new Date();
    const invitation = await this.invitationsRepository.save(this.invitationsRepository.create({
      creatorId,
      email,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      acceptedAt: null,
    }));
    const webhookUrl = process.env.BUYER_INVITATION_WEBHOOK_URL ?? process.env.MAGIC_LINK_WEBHOOK_URL;
    const appUrl = process.env.FRONTEND_URL ?? process.env.TRUSTED_ORIGINS?.split(',')[0] ?? 'http://localhost:3000';
    const url = `${appUrl.replace(/\/$/, '')}/register?email=${encodeURIComponent(email)}`;

    if (!webhookUrl) {
      if (process.env.NODE_ENV === 'production') {
        await this.invitationsRepository.delete(invitation.id);
        throw new ServiceUnavailableException('Buyer invitation email delivery is not configured');
      }
      console.info(`[Kompra] Buyer invitation for ${email}: ${url}`);
      return { email, expiresAt: invitation.expiresAt };
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, url }),
      });
      if (!response.ok) throw new Error(`Invitation email delivery failed with status ${response.status}`);
    } catch (error) {
      await this.invitationsRepository.delete(invitation.id);
      throw new ServiceUnavailableException(error instanceof Error ? error.message : 'Invitation email delivery failed');
    }
    return { email, expiresAt: invitation.expiresAt };
  }

  async getNetwork(userId: string): Promise<{ shareCode: string; contacts: UserEntity[]; role: UserRole }> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User profile not found');
    if (!user.shareCode) {
      user.shareCode = this.makeShareCode(user.id);
      await this.usersRepository.save(user);
    }
    return { shareCode: user.shareCode, contacts: await this.getContacts(userId), role: user.role };
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

  private async ensureContactPair(userId: string, contactId: string): Promise<void> {
    for (const [ownerId, linkedId] of [[userId, contactId], [contactId, userId]]) {
      const existing = await this.contactsRepository.findOneBy({ userId: ownerId, contactId: linkedId });
      if (!existing) await this.contactsRepository.save(this.contactsRepository.create({ userId: ownerId, contactId: linkedId }));
    }
  }

  private async syncNeonAuthRole(userId: string, role: UserRole): Promise<void> {
    const [{ hasRoleColumn } = { hasRoleColumn: false }] = await this.dataSource.query<Array<{ hasRoleColumn: boolean }>>(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'neon_auth' AND table_name = 'user' AND column_name = 'role'
      ) AS "hasRoleColumn"`,
    );
    if (hasRoleColumn) await this.dataSource.query(`UPDATE neon_auth."user" SET role = $1 WHERE id = $2`, [role, userId]);
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
