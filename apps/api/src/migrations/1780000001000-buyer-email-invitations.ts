import type { MigrationInterface, QueryRunner } from 'typeorm';

export class BuyerEmailInvitations1780000001000 implements MigrationInterface {
  name = 'BuyerEmailInvitations1780000001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CREATOR'`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "buyer_invitations" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "creatorId" varchar(255) NOT NULL,
      "email" varchar(320) NOT NULL,
      "expiresAt" timestamptz NOT NULL,
      "acceptedAt" timestamptz,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_buyer_invitations_id" PRIMARY KEY ("id"),
      CONSTRAINT "FK_buyer_invitations_creator" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_buyer_invitations_email_pending" ON "buyer_invitations" ("email", "expiresAt")`);

    // Earlier sign-up allowed choosing BUYER directly. Existing users start as creators;
    // only new, verified email invitations can create BUYER accounts from this point on.
    await queryRunner.query(`UPDATE "users" SET "role" = 'CREATOR' WHERE "role" = 'BUYER'`);
    await queryRunner.query(`DO $$ BEGIN
      IF to_regclass('neon_auth."user"') IS NOT NULL AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'neon_auth' AND table_name = 'user' AND column_name = 'role'
      ) THEN
        EXECUTE 'UPDATE neon_auth."user" SET role = ''CREATOR'' WHERE role = ''BUYER''';
        EXECUTE 'ALTER TABLE neon_auth."user" ALTER COLUMN role SET DEFAULT ''CREATOR''';
      END IF;
    END $$`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_buyer_invitations_email_pending"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "buyer_invitations"`);
  }
}
