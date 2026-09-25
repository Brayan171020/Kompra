import { PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { betterAuth } from 'better-auth';
import { bearer, magicLink } from 'better-auth/plugins';

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://localhost:5432/kompra';
const trustedOrigins = (process.env.TRUSTED_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

const databasePool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
});

export { trustedOrigins };

const auth = betterAuth({
  appName: 'Kompra',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:4000',
  basePath: '/api/v1/auth',
  secret: process.env.BETTER_AUTH_SECRET ?? (isProduction ? (() => { throw new Error('BETTER_AUTH_SECRET must be configured in production'); })() : 'kompra-local-development-secret-change-me-32-chars'),
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
  rateLimit: { enabled: true, window: 60, max: 5, storage: 'memory' },
  socialProviders: googleClientId && googleClientSecret ? {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  } : undefined,
  plugins: [
    bearer(),
    magicLink({
      expiresIn: 60 * 15,
      rateLimit: { window: 60, max: 5 },
      sendMagicLink: async ({ email, url }) => {
        const webhookUrl = process.env.MAGIC_LINK_WEBHOOK_URL;
        if (!webhookUrl) {
          if (isProduction) throw new Error('MAGIC_LINK_WEBHOOK_URL must be configured in production');
          console.info(`[Kompra] Magic link for ${email}: ${url}`);
          return;
        }
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, url }),
        });
        if (!response.ok) throw new Error(`Magic link delivery failed with status ${response.status}`);
      },
    }),
  ],
  advanced: {
    database: {
      generateId: 'uuid',
    },
    useSecureCookies: isProduction,
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
    },
  },
}) as unknown as ReturnType<typeof betterAuth>;

export { auth };

export type AuthSession = {
  user: { id: string; name: string; email: string; role?: string | null };
  session: { id: string };
};
