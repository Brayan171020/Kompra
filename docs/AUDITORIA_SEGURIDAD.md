# Auditoría de seguridad y superficie HTTP

Fecha: 2026-10-16. Alcance: `apps/api` y `apps/web`.

## Autenticación y autorización

- `AuthGuard` es global: toda ruta NestJS requiere una sesión válida salvo `GET /api/v1/health`, que declara `@Public()`.
- `RolesGuard` exige `CREATOR` en las operaciones exclusivas de ese rol. El rol efectivo se consulta en `public.users` en cada petición; el rol guardado en una sesión antigua no concede privilegios.
- Las rutas compartidas verifican la identidad en los servicios: listas e ítems por creador o persona asignada; inventario, productos y plantillas por propietario. La asignación de listas exige que la persona asignada sea un contacto, incluso si tiene rol `CREATOR`.
- Los códigos para vincular contactos son aleatorios de 96 bits y se generan una sola vez. La migración rota los códigos antiguos derivados de UUID, que podían adivinarse al conocer el ID de un usuario.
- `GET /categories` exige sesión y devuelve categorías globales más las creadas por el solicitante. Los servicios de ítems, productos, inventario y plantillas solo aceptan categorías globales o del propietario correspondiente.

## Validación, transporte y datos sensibles

- `ValidationPipe` global usa `whitelist`, `forbidNonWhitelisted` y `transform`. Las consultas SQL dinámicas usan parámetros de TypeORM o placeholders de PostgreSQL; no se interpolan valores recibidos del cliente.
- Helmet está habilitado y CORS acepta los orígenes de `TRUSTED_ORIGINS`. Las conexiones PostgreSQL a Neon verifican el certificado TLS.
- Better Auth usa cookies `httpOnly`; el frontend obtiene la sesión por su cliente de autenticación y envía el token de sesión en el header `Authorization` de `apiFetch`. No se encontraron usos de `localStorage`, `sessionStorage` ni `dangerouslySetInnerHTML` en `apps/web`.
- El logging HTTP registra el path sin query string y omite cuerpos, tokens, mensajes y stack traces. Los enlaces mágicos e invitaciones se entregan mediante webhook configurado y no se imprimen en consola. Si falta el webhook, la operación falla. `GET /users/me` devuelve solo los campos de perfil y metadatos de sesión necesarios; las respuestas de contactos omiten el código privado de cada contacto. Swagger no persiste la autorización en el navegador.

## Correlación de endpoints con el frontend

| Área | Rutas consumidas en `apps/web` | Decisión |
| --- | --- | --- |
| Salud | `GET /health` | Se conserva para comprobación de disponibilidad. |
| Categorías | `GET /categories`, `POST /categories` | Se conservan; lectura autenticada y filtrada. |
| Usuarios | `GET /users/me`, `GET /users/me/code`, `GET /users/contacts`, `POST /users/contacts/link`, `POST /users/buyer-invitations` | Se conservan. |
| Listas | `POST /lists`, `GET /lists`, `GET /lists/:id`, `PATCH /lists/:id/assign`, `PATCH /lists/:id/finish` | Se conservan. |
| Ítems | `POST /lists/:listId/items`, `PATCH /items/:id/status`, `DELETE /items/:id` | Se conservan. |
| Productos | `GET /products`, `POST /products` | Se conservan. |
| Inventario | `POST /inventory`, `GET /inventory`, `GET /inventory/summary`, `POST /inventory/import-from-list/:listId` | Se conservan. |
| Plantillas | `POST /templates`, `POST /templates/from-list/:listId`, `GET /templates`, `PATCH /templates/:id`, `DELETE /templates/:id`, `POST /templates/:id/instantiate` | Se conservan. `GET /templates/:id` se retiró: no tenía consumidor y el listado incluye los ítems. |
| Autenticación | `/api/v1/auth/*` y proxy web `/api/auth/*` | Se conservan como contrato de Better Auth y Neon Auth. |

## Verificación

`pnpm lint`, `pnpm test`, `pnpm --filter @kompra/api test:e2e` y `pnpm build` pasan. Las pruebas de seguridad cubren categoría privada, rol de sesión obsoleto, asignación a contactos y persistencia de códigos aleatorios.
