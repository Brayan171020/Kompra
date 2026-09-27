import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Pool } from 'pg';
import { auth } from '../auth/auth.js';
import { UserEntity, UserRole } from '../entities/user.entity.js';

const adminEmail = (process.env.ADMIN_EMAIL ?? 'brayangt1710@gmail.com').trim().toLowerCase();
const adminName = 'Brayan Gamboa';
const creatorEmails = [...new Set([
  adminEmail,
  ...(process.env.CREATOR_EMAILS ?? 'bjgamboa.19@est.ucab.edu.ve')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
])];

async function seedAdmin(): Promise<void> {
  const password = process.env.ADMIN_PASSWORD;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL must be configured.');

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
  });
  const dataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    ssl: databaseUrl.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
    entities: [UserEntity],
    synchronize: false,
  });

  try {
    const existing = await pool.query<{ id: string }>(
      'SELECT id FROM neon_auth."user" WHERE lower(email) = lower($1) LIMIT 1',
      [adminEmail],
    );
    let userId = existing.rows[0]?.id;

    if (!userId) {
      if (!password || password.length < 8) {
        throw new Error('ADMIN_PASSWORD must be provided and contain at least 8 characters when creating the seed administrator.');
      }
      const result = await auth.api.signUpEmail({
      body: { email: adminEmail, password, name: adminName, role: UserRole.CREATOR } as never,
      });
      userId = result.user.id;
      console.log(`Created Better Auth administrator ${adminEmail}.`);
    } else {
      console.log(`Better Auth administrator ${adminEmail} already exists; leaving its password unchanged.`);
    }

    await pool.query('UPDATE neon_auth."user" SET role = $1 WHERE id = $2', [UserRole.CREATOR, userId]);

    await dataSource.initialize();
    const repository = dataSource.getRepository(UserEntity);
    const domainUser = await repository.findOneBy({ email: adminEmail });
    await repository.save(repository.create({
      id: userId,
      name: adminName,
      email: adminEmail,
      role: UserRole.CREATOR,
      ...(domainUser ? { createdAt: domainUser.createdAt } : {}),
    }));
    console.log(`Synchronized domain administrator ${adminEmail} as CREATOR.`);

    const additionalCreators = await pool.query<{ id: string; email: string }>(
      'SELECT id, email FROM neon_auth."user" WHERE lower(email) = ANY($1::text[]) AND id <> $2',
      [creatorEmails, userId],
    );
    for (const creator of additionalCreators.rows) {
      await pool.query('UPDATE neon_auth."user" SET role = $1 WHERE id = $2', [UserRole.CREATOR, creator.id]);
      await repository.update({ email: creator.email }, { role: UserRole.CREATOR });
      console.log(`Elevated designated creator ${creator.email} in both schemas.`);
    }
  } finally {
    await dataSource.destroy().catch(() => undefined);
    await pool.end();
  }
}

seedAdmin().catch((error: unknown) => {
  console.error('Admin seed failed:', error);
  process.exitCode = 1;
});
