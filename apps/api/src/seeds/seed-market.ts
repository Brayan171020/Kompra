import 'dotenv/config';
import { DataSource } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity.js';
import { ListItemEntity, ListItemStatus, QuantityType } from '../entities/list-item.entity.js';
import { ShoppingListEntity, ShoppingListStatus } from '../entities/shopping-list.entity.js';
import { UserEntity } from '../entities/user.entity.js';
import { InventoryPurchaseEntity } from '../entities/inventory-purchase.entity.js';
import { UserContactEntity } from '../entities/user-contact.entity.js';

const email = 'brayangt1710@gmail.com';
const groups = [
  { name: 'Víveres / Despensa', color: '#E9C46A', icon: 'wheat', items: [['Arroz', 2, QuantityType.WEIGHT, 'kg'], ['Harina de Maíz', 3, QuantityType.UNIT, 'paquete'], ['Pasta', 2, QuantityType.UNIT, 'paquete'], ['Aceite vegetal', 1, QuantityType.UNIT, 'litro'], ['Azúcar', 1, QuantityType.WEIGHT, 'kg'], ['Café molido', 500, QuantityType.WEIGHT, 'g']] },
  { name: 'Frescos / Proteínas', color: '#E76F51', icon: 'beef', items: [['Pechuga de pollo', 1.5, QuantityType.WEIGHT, 'kg'], ['Carne molida', 1, QuantityType.WEIGHT, 'kg'], ['Huevos', 30, QuantityType.UNIT, 'und'], ['Queso blanco', 1, QuantityType.WEIGHT, 'kg']] },
  { name: 'Frutas y Verduras', color: '#2A9D8F', icon: 'carrot', items: [['Plátanos', 1, QuantityType.WEIGHT, 'kg'], ['Cebollas', 1, QuantityType.WEIGHT, 'kg'], ['Tomates', 1, QuantityType.WEIGHT, 'kg'], ['Papas', 1.5, QuantityType.WEIGHT, 'kg'], ['Aguacates', 2, QuantityType.UNIT, 'und']] },
  { name: 'Limpieza y Hogar', color: '#457B9D', icon: 'sparkles', items: [['Detergente para ropa', 1, QuantityType.UNIT, 'galón'], ['Lavaplatos líquido', 500, QuantityType.WEIGHT, 'ml'], ['Papel higiénico', 4, QuantityType.UNIT, 'rollos'], ['Cloro', 1, QuantityType.UNIT, 'litro']] },
] as const;

async function seedMarket(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL must be configured.');
  const dataSource = new DataSource({ type: 'postgres', url: databaseUrl, ssl: databaseUrl.includes('neon.tech') ? { rejectUnauthorized: false } : undefined, entities: [UserEntity, UserContactEntity, CategoryEntity, ShoppingListEntity, ListItemEntity, InventoryPurchaseEntity], synchronize: false });
  await dataSource.initialize();
  try {
    const users = dataSource.getRepository(UserEntity); const categories = dataSource.getRepository(CategoryEntity); const lists = dataSource.getRepository(ShoppingListEntity); const items = dataSource.getRepository(ListItemEntity);
    const admin = await users.findOneByOrFail({ email });
    let list = await lists.findOne({ where: { creatorId: admin.id, status: ShoppingListStatus.ACTIVE }, order: { createdAt: 'DESC' } });
    if (!list) list = await lists.save(lists.create({ title: 'Compra Semanal Completa', creatorId: admin.id, assignedToId: null, status: ShoppingListStatus.ACTIVE, finishedAt: null }));
    for (const group of groups) {
      let category = await categories.findOneBy({ name: group.name });
      if (!category) category = await categories.save(categories.create({ name: group.name, color: group.color, icon: group.icon, creatorId: admin.id }));
      for (const [name, quantity, quantityType, unit] of group.items) {
        const existing = await items.findOneBy({ listId: list.id, name });
        if (!existing) await items.save(items.create({ listId: list.id, categoryId: category.id, name, quantityType, targetQuantity: quantity, status: ListItemStatus.PENDING, purchasedQuantity: 0, note: `Unidad estándar: ${unit}` }));
      }
    }
    console.log(`Seeded market items into list ${list.id} for ${email}.`);
  } finally { await dataSource.destroy(); }
}

seedMarket().catch((error: unknown) => { console.error('Market seed failed:', error); process.exitCode = 1; });
