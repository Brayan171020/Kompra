import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddListTemplatesAndItemCost1780000000000 implements MigrationInterface {
  name = 'AddListTemplatesAndItemCost1780000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "list_items" ADD COLUMN IF NOT EXISTS "cost" numeric(12,2)`);
    await queryRunner.query(`ALTER TABLE "list_items" DROP CONSTRAINT IF EXISTS "CHK_list_items_cost_nonnegative"`);
    await queryRunner.query(`ALTER TABLE "list_items" ADD CONSTRAINT "CHK_list_items_cost_nonnegative" CHECK ("cost" IS NULL OR "cost" >= 0)`);

    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "template_items_quantity_type_enum" AS ENUM ('UNIT', 'WEIGHT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "list_templates" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "title" varchar(120) NOT NULL,
      "creatorId" varchar(255) NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_list_templates_id" PRIMARY KEY ("id"),
      CONSTRAINT "FK_list_templates_creator" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_list_templates_creator" ON "list_templates" ("creatorId")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "template_items" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "templateId" uuid NOT NULL,
      "categoryId" uuid NOT NULL,
      "name" varchar(120) NOT NULL,
      "quantityType" "template_items_quantity_type_enum" NOT NULL,
      "targetQuantity" numeric(12,3) NOT NULL,
      "note" text,
      CONSTRAINT "PK_template_items_id" PRIMARY KEY ("id"),
      CONSTRAINT "FK_template_items_template" FOREIGN KEY ("templateId") REFERENCES "list_templates"("id") ON DELETE CASCADE,
      CONSTRAINT "CHK_template_items_target_positive" CHECK ("targetQuantity" >= 0.001)
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_template_items_template" ON "template_items" ("templateId")`);

    // A list item may now be represented once in each participant's inventory.
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_inventory_source_item"`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_inventory_source_item_owner" ON "inventory_purchases" ("sourceItemId", "creatorId") WHERE "sourceItemId" IS NOT NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_inventory_source_item_owner"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_template_items_template"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "template_items"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_list_templates_creator"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "list_templates"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "template_items_quantity_type_enum"`);
    await queryRunner.query(`ALTER TABLE "list_items" DROP CONSTRAINT IF EXISTS "CHK_list_items_cost_nonnegative"`);
    await queryRunner.query(`ALTER TABLE "list_items" DROP COLUMN IF EXISTS "cost"`);
  }
}
