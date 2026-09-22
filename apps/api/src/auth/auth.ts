import { PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins';

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://localhost:5432/kompra';
const trustedOrigins = (process.env.TRUSTED_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const databasePool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
});

export { trustedOrigins };

export const auth = betterAuth({
  appName: 'Kompra',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:4000',
  basePath: '/api/v1/auth',
  secret: process.env.BETTER_AUTH_SECRET ?? 'kompra-local-development-secret-change-me-32-chars',
  trustedOrigins,
  database: {
    dialect: new PostgresDialect({ pool: databasePool }),
    type: 'postgres',
    schemaName: 'neon_auth',
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'BUYER',
        input: true,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  plugins: [bearer()],
  advanced: {
    useSecureCookies: isProduction,
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
