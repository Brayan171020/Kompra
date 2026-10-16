import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RandomizeContactCodes1780000003000 implements MigrationInterface {
  name = 'RandomizeContactCodes1780000003000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" ALTER COLUMN "shareCode" TYPE varchar(28)');
    await queryRunner.query(`UPDATE "users"
      SET "shareCode" = 'KMP-' || upper(
        substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) ||
        substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)
      )
      WHERE "shareCode" IS NOT NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "users"
      SET "shareCode" = 'KMP-' || upper(substr(replace("id", '-', ''), 1, 5))
      WHERE "shareCode" IS NOT NULL`);
    await queryRunner.query('ALTER TABLE "users" ALTER COLUMN "shareCode" TYPE varchar(9)');
  }
}
