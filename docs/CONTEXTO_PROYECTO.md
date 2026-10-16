# Kompra: contexto del proyecto y mapa del código

> Corte: 16 de octubre de 2026. Este documento describe el código del workspace. Para decisiones históricas y más detalle funcional, consultar [README](../README.md), [LOGICA_PROYECTO](../LOGICA_PROYECTO.md) y [PLAN](PLAN.md). Si esos textos discrepan del código, este documento toma como referencia la implementación actual.

## Qué es Kompra

Kompra es una aplicación para coordinar listas de compras o encargos entre personas y conservar un historial de adquisiciones. Una persona con rol `CREATOR` crea y administra listas; una persona con rol `BUYER` puede trabajar sobre listas asignadas. Cada usuario también puede registrar compras manuales y consultar su inventario personal. Aquí «compra» significa una adquisición registrada, no una orden de venta ni un pago en línea.

El flujo principal es: iniciar sesión, sincronizar el perfil de dominio, crear una lista, añadir productos y cantidades, asignarla si hace falta, marcar ítems como adquiridos total o parcialmente, registrar su costo y cerrar la lista. Las adquisiciones de ítems se reflejan en inventario; existe además una importación idempotente para completar registros de listas finalizadas.

## Arquitectura y estructura

```mermaid
flowchart LR
    U[Usuario] --> W[Next.js / React<br/>apps/web]
    W -->|Sesión y OAuth| P[/api/auth/*<br/>Neon Auth adapter]
    W -->|REST /api/v1 + Bearer| A[NestJS<br/>apps/api]
    A -->|Guards, servicios, TypeORM| DB[(PostgreSQL / Neon<br/>dominio público)]
    A -->|Better Auth / sesiones| AUTH[(neon_auth)]
    P --> AUTH
```

| Ubicación | Función |
| --- | --- |
| `apps/api/src/main.ts` | Arranque de Express/Nest, CORS, Helmet, validación, prefijo `/api`, versionado URI y Swagger. |
| `apps/api/src/app.module.ts` | Configuración de PostgreSQL/TypeORM, migraciones, límite global de solicitudes y módulos de dominio. |
| `apps/api/src/entities/` | Modelo de persistencia del dominio. |
| `apps/api/src/{users,lists,items,products,templates,inventory,categories,health}/` | Controladores, servicios y DTO de cada área. |
| `apps/api/src/auth/` | Better Auth y guards de sesión y rol. |
| `apps/api/src/migrations/` y `seeds/` | Evolución de esquema y datos iniciales. |
| `apps/web/app/` | Rutas del App Router y vistas. |
| `apps/web/components/` | Formularios y herramientas reutilizables de la interfaz. |
| `apps/web/lib/` | Cliente HTTP y adaptación de autenticación. |
| `.github/workflows/ci.yml` | Build, typecheck y pruebas de la API en CI. |

El monorepo usa `pnpm` workspaces. El backend está escrito en TypeScript con NestJS 11, Express 5 y TypeORM 0.3. El frontend usa Next.js 16, React 19, Tailwind CSS 4 y Lucide. PostgreSQL de Neon persiste el dominio; Better Auth usa el esquema `neon_auth` mediante Kysely/`pg`.

## Backend: responsabilidades

| Módulo | Qué hace |
| --- | --- |
| `AuthModule` | Instala `AuthGuard` y `RolesGuard` globales. Better Auth atiende `/api/v1/auth/*`; `ThrottlerGuard` limita solicitudes. |
| `UsersModule` | Sincroniza identidad autenticada con `users`, genera código para compartir, vincula contactos en ambas direcciones e invita compradores por correo. |
| `CategoriesModule` | Lista categorías globales y personales; permite crear categorías a `CREATOR`. |
| `ListsModule` | Crea listas, devuelve las propias o asignadas, agrupa ítems por categoría, asigna participantes y finaliza listas. |
| `ItemsModule` | Añade ítems, actualiza estado/cantidad/costo y elimina ítems de listas activas. Sincroniza compras de inventario al actualizar estados. |
| `ProductsModule` | Mantiene un catálogo privado de productos reutilizables por creador. |
| `TemplatesModule` | Crea, consulta, edita y elimina plantillas privadas; puede guardarlas desde una lista activa e instanciarlas como una lista nueva. |
| `InventoryModule` | Registra compras manuales, ofrece historial paginado con filtros, calcula métricas mensuales e importa compras faltantes de listas finalizadas. |
| `HealthModule` | Comprueba respuesta de la API y conectividad con PostgreSQL. |

### API REST

El prefijo de negocio es `/api/v1`. El contrato navegable está en `/api/docs` y el JSON OpenAPI en `/api/docs-json`. La referencia de Better Auth está en `/api/v1/auth/reference`.

| Área | Rutas implementadas | Acceso |
| --- | --- | --- |
| Salud | `GET /health` | Público. |
| Categorías | `GET /categories`, `POST /categories` | Lectura autenticada de categorías globales y propias; creación `CREATOR`. |
| Usuarios | `GET /users/me`, `GET /users/me/code`, `GET /users/contacts`, `POST /users/contacts/link`, `POST /users/buyer-invitations` | Sesión; invitaciones `CREATOR`. |
| Listas | `POST /lists`, `GET /lists`, `GET /lists/:id`, `PATCH /lists/:id/assign`, `PATCH /lists/:id/finish` | Sesión; creación, asignación y cierre `CREATOR`, con verificación de propietario en el servicio. |
| Ítems | `POST /lists/:listId/items`, `PATCH /items/:id/status`, `DELETE /items/:id` | Sesión; alta y eliminación `CREATOR` propietario; estado para propietario o asignado. |
| Productos | `GET /products`, `POST /products` | `CREATOR`; catálogo propio. |
| Plantillas | `GET /templates`, `POST /templates`, `POST /templates/from-list/:listId`, `PATCH /templates/:id`, `DELETE /templates/:id`, `POST /templates/:id/instantiate` | `CREATOR`; plantillas propias. |
| Inventario | `GET /inventory`, `GET /inventory/summary`, `POST /inventory`, `POST /inventory/import-from-list/:listId` | Sesión; datos asociados al usuario. |

### Autenticación y autorización

- El frontend usa `@neondatabase/auth/next` (`apps/web/lib/auth-client.ts`). La ruta `/api/auth/[...path]` delega las solicitudes al adaptador de Neon Auth configurado en `auth-server.ts`. `apps/web/proxy.ts` protege `/app/*` y redirige a `/login` cuando no hay sesión.
- La API configura Better Auth en `apps/api/src/auth/auth.ts` para correo/contraseña, enlace mágico y Google si se suministran credenciales locales. La vista de acceso y registro ofrece esos caminos. El backend también expone el manejador de Better Auth bajo `/api/v1/auth/*`.
- `apiFetch` obtiene la sesión, envía el token como `Authorization: Bearer` cuando está disponible y hace solicitudes a `${NEXT_PUBLIC_API_URL}/api/v1`. El `AuthGuard` valida la sesión con Better Auth y, si falla, intenta resolver el Bearer contra `neon_auth.session` y `neon_auth.user`. `RolesGuard` aplica `@Roles(...)`; los servicios vuelven a comprobar propiedad y participación.
- `GET /users/me` crea o actualiza el perfil de dominio. Las cuentas nuevas parten como `CREATOR`; una invitación pendiente para un correo verificado puede convertir al usuario en `BUYER` y vincularlo con quien lo invitó. El rol resultante se sincroniza con `neon_auth.user` si existe esa columna.
- La API aplica validación DTO con rechazo de campos no permitidos, CORS para orígenes confiables, Helmet, límites de solicitudes, filtro global de errores y logging sin query strings. Solo `GET /health` usa `@Public()`.

### Modelo de datos

| Entidad / tabla | Papel principal |
| --- | --- |
| `UserEntity` / `users` | Perfil de dominio, correo, rol `CREATOR` o `BUYER` y `shareCode`. |
| `UserContactEntity` / `user_contacts` | Relación de contactos guardada en ambas direcciones. |
| `BuyerInvitationEntity` / `buyer_invitations` | Invitación por correo con caducidad y fecha de aceptación. |
| `CategoryEntity` / `categories` | Categorías iniciales o creadas por un usuario. |
| `ProductEntity` / `products` | Nombre, categoría y tipo de cantidad del catálogo privado. |
| `ShoppingListEntity` / `shopping_lists` | Título, propietario, asignado opcional, estado y preferencia de copia al inventario del asignado. |
| `ListItemEntity` / `list_items` | Producto, categoría, meta, cantidad adquirida, estado, nota y costo. |
| `ListTemplateEntity` / `list_templates` | Cabecera de plantilla perteneciente a un creador. |
| `TemplateItemEntity` / `template_items` | Productos y cantidades reutilizables de una plantilla. |
| `InventoryPurchaseEntity` / `inventory_purchases` | Adquisición manual o vinculada a un ítem de lista, con cantidad, unidad, fecha, costo y propietario del inventario. |

Estados: lista `ACTIVE` → `FINISHED`; ítem `PENDING`, `PARTIALLY_COMPLETED` o `COMPLETED`. Los productos `UNIT` y las compras en `und` o `paquete` requieren cantidades enteras; peso y otras unidades admiten fracciones según sus DTO. Una finalización parcial requiere cantidad menor que la meta y una nota.

Al marcar un ítem como adquirido, `ItemsService.updateStatus` actualiza ítem e inventario en una transacción con bloqueo. Guarda una compra para el creador y, si `copyToAssigneeInventory` está activo, otra para la persona asignada. Volver a `PENDING` borra las compras relacionadas. El índice único parcial `(sourceItemId, creatorId)` evita duplicados por propietario; `InventoryService.importFromList` recupera filas faltantes de listas finalizadas. El resumen de inventario usa el mes UTC actual y muestra totales, volumen por unidad, gasto por categoría, productos más costosos y costo promedio por registro.

## Frontend: pantallas y experiencia

| Ruta o pieza | Qué ofrece |
| --- | --- |
| `/` | Página pública de presentación y acceso a la aplicación. |
| `/login` y `/register` | Acceso/registro con correo y contraseña, enlace mágico y Google; registro desde invitación de comprador. |
| `/app` | Tablero de listas propias o asignadas, selección de lista, ítems agrupados por categoría, progreso, alta de productos, cambios de estado, compras parciales, costos y cierre. |
| `/app/inventory` | Historial de adquisiciones, búsqueda y filtro por categoría, métricas mensuales y registro manual de compras. |
| `FriendNetwork` | Consulta del código para compartir, vinculación de contactos e invitaciones. |
| `ListAssignmentQuick` | Asignación de una lista y elección de copia al inventario del asignado. |
| `CategoryQuickCreate` | Creación rápida de categorías. |
| `TemplateManager` | Guardar la lista activa como plantilla, editar plantillas e iniciar listas a partir de ellas. |

`AppLayout` espera una sesión y llama a `/users/me` antes de mostrar las herramientas del área privada; así prepara el perfil y el rol. El tablero usa `apiFetch` para leer listas, categorías y detalle, y para enviar acciones. Las vistas muestran controles según el rol y la propiedad de la lista; la autorización definitiva está en la API. La interfaz es adaptable a móvil y escritorio.

### Recorrido de datos típico

1. El usuario se autentica; la web consulta la sesión mediante `/api/auth/*`.
2. El área privada llama a `GET /api/v1/users/me`; el backend sincroniza el usuario del proveedor con `users`.
3. El tablero carga `GET /lists`, `GET /categories` y `GET /lists/:id`; los controladores delegan en servicios y repositorios TypeORM.
4. Un `CREATOR` crea o selecciona un producto de su catálogo y lo añade a la lista. Al cambiar su estado, la API persiste el ítem y su compra enlazada dentro de la misma transacción.
5. La pantalla de inventario consulta `GET /inventory` y `GET /inventory/summary`, siempre filtrados por el propietario de ese inventario.

## Configuración, ejecución y calidad

Requisitos documentados: Node.js 20+, `pnpm` 9+ y PostgreSQL. Las variables de ejemplo están en [`.env.example`](../.env.example) y [`apps/api/.env.example`](../apps/api/.env.example). Las principales son `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `TRUSTED_ORIGINS`, `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_NEON_AUTH_URL` o `NEON_AUTH_BASE_URL`, y `NEON_AUTH_COOKIE_SECRET`. Google y los webhooks de enlace mágico e invitación se configuran con sus variables específicas. No guardar secretos reales en Git.

```bash
pnpm install
pnpm dev
pnpm lint
pnpm test
pnpm build
pnpm --filter @kompra/api test:e2e
```

El `package.json` raíz ejecuta build de API y web, desarrollo paralelo, typecheck y pruebas disponibles. La API tiene pruebas Jest y E2E con Supertest; la web tiene typecheck y build, sin script de pruebas propio. GitHub Actions ejecuta estas verificaciones con PostgreSQL de prueba. El endpoint de salud local es `http://localhost:4000/api/v1/health` y Swagger local está en `http://localhost:4000/api/docs`.

## Contexto obtenido de Codebase Memory

Se reindexó el workspace con `codebase-memory-mcp` en modo `moderate`, proyecto **`K-trabajo3-kompra`**. En este corte el grafo contiene **834 nodos y 2055 relaciones**, con **111 archivos**, **133 funciones**, **104 métodos**, **77 clases** y **5 nodos Route**. Registra principalmente TypeScript y separa los paquetes `api` y `web`. El índice excluye, entre otros, `docs/`, migraciones, seeds, dependencias y artefactos de build; por eso este documento contrastó el grafo con archivos de configuración, documentación y controladores actuales.

Hallazgos útiles para orientarse:

| Hallazgo del grafo | Lectura práctica |
| --- | --- |
| `apps/web/lib/api.ts:apiFetch` tiene 17 llamadas entrantes detectadas. | Es el punto común para las operaciones REST del frontend; investigar aquí primero si falla la comunicación web/API. |
| `TemplatesService.assertCreator` tiene 7 relaciones entrantes detectadas. | La restricción de rol se reafirma dentro del servicio, además de los decoradores del controlador. |
| `ListsService.getAuthorizedList` aparece en rutas de consulta, asignación y cierre. | Centraliza la comprobación de acceso a listas para esos flujos; ítems y plantillas también lo usan directamente en el código. |
| El grafo agrupa un clúster de tablero (`ListsBoard`, `Dialog`, `AddItemDialog`, `updateItem`) y otro de inventario (`InventoryPage`, `load`, `PurchaseForm`). | Las pantallas grandes concentran lógica de UI y llamadas a la API. |
| Hay clústeres separados para autenticación (`LoginForm`, `RegisterForm`), plantillas (`TemplateManager`), asignación de listas, usuarios/contactos e ítems. | Estos son los límites funcionales más visibles al seguir llamadas, aunque algunos cruzan carpetas. |
| `ItemsService.updateStatus` y `InventoryService.importFromList` son los puntos donde lista e inventario se conectan. | Revisar ambos y la entidad `InventoryPurchaseEntity` al cambiar reglas de adquisiciones o deduplicación. |

El detector de rutas del grafo solo identificó 5 nodos Route en este corte; la tabla de endpoints anterior se comprobó en los decoradores de los controladores, no se dedujo de ese recuento. Los números del grafo son una instantánea, no métricas de producción. Para investigar cambios futuros, usar `search_graph` para encontrar símbolos, `trace_path` para sus relaciones, `get_code_snippet` para leerlos y reindexar cuando cambie el código.
