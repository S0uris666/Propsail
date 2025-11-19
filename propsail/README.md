# Propsail  Login con 2FA

Backend NestJS minimalista que implementa únicamente la primera historia del documento `auth-login-2fa-spec.md`: autenticación con usuario/contraseña, emisión de un token de segundo factor por correo y registro del reto.

## Stack

- NestJS 11 + TypeScript.
- Prisma ORM con MariaDB/MySQL.
- Bcrypt para hash de contraseÃ±as.
- Servicios auxiliares (`UsersService`, `AuthService`, `SecurityService`, `EmailService`) desacoplados para poder evolucionar el flujo.

## Puesta en marcha

1. Copia `.env.example` a `.env` y define `DATABASE_URL` + `TWO_FACTOR_TOKEN_TTL_MINUTES`.
2. Instala dependencias: `npm install`.
3. Genera Prisma Client y aplica la migración inicial: `npx prisma migrate deploy`.
4. Ejecuta la API:
   - Desarrollo: `npm run start:dev`.
   - Producción: `npm run start:prod`.

## Endpoints disponibles

| Método + ruta     | Descripción | Body esperado |
| ----------------- | ----------- | ------------- |
| `POST /users`     | Crea un usuario con email y username Ãºnicos. | `{ email, username, fullName?, password }` |
| `POST /auth/login`| Primer factor: valida credenciales y genera el reto 2FA. | `{ identifier, password }` |

### Detalle del flujo `POST /auth/login`
1. Se recibe `identifier` (email o username) y `password`.
2. Si las credenciales no son válidas se responde **401** con el mensaje genérico `Credenciales inválidas`.
3. Si son correctas:
   - Se marcan los códigos vigentes como usados dentro de una transacción.
   - Se crea un token numérico aleatorio de 6 dígitos con expiración configurable.
   - Se almacena en `TwoFactorToken` con `used=false`.
   - Se simula el envío por correo mediante `EmailService`, registrando solo metadatos (nunca el token).
   - La API responde con `{ challengeId, expiresAt, message }` sin otorgar acceso todavía.

Este repositorio deja listo el backend para que el siguiente user story (`/auth/verify-2fa`) consuma los `challengeId` registrados.

### Roadmap inmediato
- US-LOGIN-001: listo. `/auth/login` crea retos 2FA transaccionales y registra `challengeId` + `expiresAt`.
- US-LOGIN-002: pendiente; `/auth/verify-2fa` consumira los retos guardados.
