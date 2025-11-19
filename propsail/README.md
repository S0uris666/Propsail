# Propsail - Login con 2FA

Backend NestJS minimalista que implementa las historias US-LOGIN-001 y US-LOGIN-002 del documento `auth-login-2fa-spec.md`: primer factor con usuario/contraseña, registro del reto 2FA y validación del token para emitir un JWT.

## Stack

- NestJS 11 + TypeScript.
- Prisma ORM con MariaDB/MySQL.
- Bcrypt para hash de contraseñas.
- Servicios auxiliares (`UsersService`, `AuthService`, `SecurityService`, `EmailService`) desacoplados para poder evolucionar el flujo.
- @nestjs/jwt para emitir el `accessToken` cuando el reto 2FA es válido.

## Puesta en marcha

1. Copia `.env.example` a `.env` y define `DATABASE_URL`, `TWO_FACTOR_TOKEN_TTL_MINUTES`, `JWT_SECRET` y (opcional) `JWT_EXPIRES_IN_SECONDS`.
2. Instala dependencias: `npm install`.
3. Genera Prisma Client y aplica la migración inicial: `npx prisma migrate deploy`.
4. Ejecuta la API:
   - Desarrollo: `npm run start:dev`.
   - Producción: `npm run start:prod`.

## Endpoints disponibles

| Método + ruta          | Descripción                                                   | Body esperado                               |
| ---------------------- | ------------------------------------------------------------- | ------------------------------------------- |
| `POST /users`          | Crea un usuario con email y username únicos.                  | `{ email, username, fullName?, password }`  |
| `POST /auth/login`     | Primer factor: valida credenciales y genera el reto 2FA.      | `{ identifier, password }`                  |
| `POST /auth/verify-2fa`| Segundo factor: valida el token y entrega un JWT.             | `{ challengeId, token }`                    |

### Detalle del flujo `POST /auth/login`

1. Se recibe `identifier` (email o username) y `password`.
2. Si las credenciales no son válidas se responde **401** con el mensaje genérico `Credenciales inválidas`.
3. Si son correctas:
   - Se marcan los códigos vigentes como usados dentro de una transacción.
   - Se crea un token numérico aleatorio de 6 dígitos con expiración configurable.
   - Se almacena en `TwoFactorToken` con `used=false`.
   - Se simula el envío por correo mediante `EmailService`, registrando solo metadatos (nunca el token).
   - La API responde con `{ challengeId, expiresAt, message }` sin otorgar acceso todavía.

### Detalle del flujo `POST /auth/verify-2fa`

1. Se recibe `challengeId` + `token` (exactamente 6 dígitos).
2. El backend busca el reto, valida que pertenezca a un usuario activo y que no esté expirado ni usado.
3. Si es correcto:
   - Marca `used=true` en `TwoFactorToken`.
   - Genera un JWT `accessToken` con `sub=user.id`, firmado con `JWT_SECRET` y vigencia configurable (`JWT_EXPIRES_IN_SECONDS`, 900 s por defecto).
   - Responde `{ accessToken, expiresIn, tokenType }`.
4. Si falla alguna validación se responde **401** con `Token inválido o expirado`.

### Roadmap inmediato

- US-LOGIN-001: listo. `/auth/login` crea retos 2FA transaccionales y registra `challengeId` + `expiresAt`.
- US-LOGIN-002: listo. `/auth/verify-2fa` valida el token, marca el reto como usado y emite `accessToken`.
- Próximo paso sugerido: US-LOGIN-003 (reenvío de token) o US-LOGIN-004 (bloqueo por intentos fallidos).
