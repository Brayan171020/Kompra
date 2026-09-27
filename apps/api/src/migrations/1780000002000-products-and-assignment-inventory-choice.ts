import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductsAndAssignmentInventoryChoice1780000002000 implements MigrationInterface {
  name = 'ProductsAndAssignmentInventoryChoice1780000002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "shopping_lists" ADD COLUMN IF NOT EXISTS "copyToAssigneeInventory" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "products_quantityType_enum" AS ENUM ('UNIT', 'WEIGHT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "products" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "creatorId" varchar(255) NOT NULL,
      "categoryId" uuid NOT NULL,
      "name" varchar(120) NOT NULL,
      "quantityType" "products_quantityType_enum" NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_products_id" PRIMARY KEY ("id"),
      CONSTRAINT "FK_products_creator" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_products_category" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_products_creator" ON "products" ("creatorId")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_products_creator_category_name" ON "products" ("creatorId", "categoryId", "name")`);
    await queryRunner.query(`INSERT INTO "products" ("creatorId", "categoryId", "name", "quantityType")
      SELECT DISTINCT ON (list."creatorId", item."categoryId", lower(item."name")) list."creatorId", item."categoryId", item."name", item."quantityType"::text::"products_quantityType_enum"
      FROM "list_items" item INNER JOIN "shopping_lists" list ON list."id" = item."listId"
      ORDER BY list."creatorId", item."categoryId", lower(item."name"), item."createdAt" DESC
      ON CONFLICT DO NOTHING`);
    await queryRunner.query(`INSERT INTO "products" ("creatorId", "categoryId", "name", "quantityType")
      SELECT DISTINCT ON (template."creatorId", item."categoryId", lower(item."name")) template."creatorId", item."categoryId", item."name", item."quantityType"::text::"products_quantityType_enum"
      FROM "template_items" item INNER JOIN "list_templates" template ON template."id" = item."templateId"
      ORDER BY template."creatorId", item."categoryId", lower(item."name"), template."updatedAt" DESC
      ON CONFLICT DO NOTHING`);
    await queryRunner.query(`INSERT INTO "products" ("creatorId", "categoryId", "name", "quantityType")
      SELECT DISTINCT ON (purchase."creatorId", purchase."categoryId", lower(purchase."productName")) purchase."creatorId", purchase."categoryId", purchase."productName",
        CASE WHEN purchase."unit" IN ('kg', 'g', 'litro') THEN 'WEIGHT'::"products_quantityType_enum" ELSE 'UNIT'::"products_quantityType_enum" END
      FROM "inventory_purchases" purchase
      ORDER BY purchase."creatorId", purchase."categoryId", lower(purchase."productName"), purchase."purchaseDate" DESC
      ON CONFLICT DO NOTHING`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_products_creator_category_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_creator"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "products_quantityType_enum"`);
    await queryRunner.query(`ALTER TABLE "shopping_lists" DROP COLUMN IF EXISTS "copyToAssigneeInventory"`);
  }
}
