# Especificación Oficial  
## Módulo de Autenticación con Doble Factor (2FA) y Recuperación de Contraseña  
Proyecto Maia – Arquitectura & DevSecOps  
Versión del documento: 1.0

---

# 1. Contexto

Este documento solicita formalmente a la célula de desarrollo implementar **desde cero** el módulo completo de autenticación del sistema Maia, considerando:

- Login con usuario + contraseña (primer factor).
- Validación con token enviado por correo (segundo factor).
- Recuperación de contraseña mediante enlace + token/clave temporal.
- Construcción completa desde el modelo de datos.

El equipo deberá trabajar utilizando el stack oficial:

- **Backend:** NestJS + Prisma ORM + JWT   
- **Frontend:** React + TypeScript + SDK Maia  
- **Mobile:** React Native CLI + TS + MMKV  
- **Base de datos:** MariaDB/MySQL  
- **Infra:** cPanel (Node App + storage)

------

# 2. Objetivo general

Implementar un sistema de autenticación robusto que utilice **dos factores** y permita **recuperación de contraseña segura**, manteniendo la coherencia entre backend, frontend, mobile y SDK.

---

# 3. Alcance

## ✔ Incluye
- Modelo de datos completo.
- Migraciones Prisma.
- Servicios y lógica de dominio.
- Endpoints del backend.
- Validación con DTOs, Pipes y Guards.
- Envío de token/código por correo electrónico.
- Flujo de recuperación de contraseña.
- Implementación mínima en frontend y mobile para probar los flujos.

## ✘ No incluye
- Integración con apps generadoras de códigos (Google Authenticator, Authy, etc.)
- Roles avanzados o RBAC
- UI compleja

---

# 4. Historias de Usuario

A continuación se incluyen las historias de usuario que **deben implementarse obligatoriamente**.

---

## 🟦 US-LOGIN-001 — Autenticación con usuario y contraseña

**Como** usuario registrado  
**Quiero** ingresar mi usuario y contraseña  
**Para** iniciar el proceso de acceso al sistema

### Criterios de aceptación
1. El formulario debe solicitar usuario + contraseña.  
2. Si las credenciales no son válidas → mensaje genérico:  
   *"Credenciales inválidas"*  
3. Si son válidas:
   - NO se entrega acceso todavía.
   - Se genera un **token de segundo factor**:
     - aleatorio
     - de un solo uso
     - con expiración
   - Se envía al correo del usuario.
4. Backend registra token:
   - userId
   - token
   - expiración
   - usado: false

---

## 🟦 US-LOGIN-002 — Validación del segundo factor

**Como** usuario que ya ingresó credenciales válidas  
**Quiero** ingresar el token 2FA recibido  
**Para** completar mi autenticación

### Criterios
- El backend valida token → usuario → expiración → estado.
- Si es correcto:
  - Se genera **JWT accessToken**.
  - Token 2FA queda marcado como usado.
- Si es incorrecto/expirado → error claro.

---

## 🟦 US-LOGIN-003 — Reenvío de token 2FA

**Opcional pero recomendado**

Permite reenviar el token si el usuario no lo recibió.

---

## 🟦 US-LOGIN-004 — Bloqueo por intentos fallidos

**Como** sistema  
**Quiero** bloquear temporalmente intentos  
**Para** evitar fuerza bruta

### Criterios
- Registrar intentos fallidos.
- Tras N fallos, bloquear usuario por tiempo configurable.
- Respuesta estándar:  
  *"Cuenta temporalmente bloqueada por intentos fallidos."*

---

## 🟦 US-PASS-001 — Solicitud de recuperación de contraseña

**Como** usuario que olvidó su contraseña  
**Quiero** solicitar recuperación  
**Para** recibir un enlace seguro en mi correo

### Criterios
- El usuario ingresa su correo.  
- El sistema genera:
  - token de recuperación (o clave temporal)
  - fecha creación
  - expiración
- Se envía correo con:
  - URL segura
  - token temporal
- Si correo no existe, respuesta genérica.

---

## 🟦 US-PASS-002 — Acceso a la URL de recuperación

**Como** usuario  
**Quiero** abrir el enlace recibido  
**Para** cambiar mi contraseña

### Criterios
- Validar:
  - token existe
  - no expirado
  - no usado
- Mostrar formulario para:
  - nueva contraseña
  - confirmación
  - token/clave temporal (si se usa)

---

## 🟦 US-PASS-003 — Cambio de contraseña con clave temporal

**Como** usuario  
**Quiero** ingresar nueva contraseña + token temporal  
**Para** recuperar mi cuenta

### Criterios
- Validación estricta:
  - políticas de contraseña
  - coincidencia confirmación
  - validez token temporal
- Backend:
  - hashea contraseña
  - actualiza usuario
  - invalida token
  - opcional: invalidar sesiones previas

---

## 🟦 US-SEC-001 — Política mínima de contraseñas

### Criterios
- Contraseña debe tener:
  - mínimo 8 caracteres
  - una letra
  - un número
- Validar en backend y frontend/mobile.

---

# 5. Requerimientos técnicos

## 5.1 Backend (NestJS + Prisma)
- Modelos:
  - User
  - TwoFactorToken
  - PasswordRecoveryRequest
  - LoginAttempt (si se implementa)
- Controladores:
  - `/auth/login`
  - `/auth/verify-2fa`
  - `/auth/request-password-reset`
  - `/auth/confirm-password-reset`
- Servicios:
  - AuthService
  - EmailService (mock o real)
  - SecurityService
- DTOs:
  - LoginDto
  - Verify2FADto
  - PasswordResetRequestDto
  - ConfirmPasswordResetDto

---

## 5.2 Frontend (React)
- Formularios:
  - login
  - token 2FA
  - forgot password
  - reset password
- Uso del SDK Maia cuando esté listo.
- Estados:
  - loading
  - error
  - success

---

## 5.3 Mobile (React Native)
- Igual que frontend.
- Uso de MMKV para almacenar JWT.

---

# 6. Requerimientos de seguridad

- Contraseñas siempre hasheadas.
- Tokens:
  - aleatorios
  - expirables
  - de un solo uso
- No loguear datos sensibles.
- No exponer detalles internos en errores.
- Revisiones obligatorias de código con enfoque DevSecOps.

---

# 7. Entregables

1. Modelo de datos en Prisma + migraciones.
2. Endpoints 100% funcionales documentados en Swagger (no implementado... aun).
3. Flujos mínimos en frontend y mobile.
4. Documentación actualizada en maia-docs (no implementado... aun).
5. Validaciones de seguridad completas.

---

# 8. Definition of Done (DoD)

- Todos los endpoints implementados.
- Swagger actualizado (no implementado aun).
- Tests manuales completados del flujo:
  - Login → token por correo → acceso.
  - Recuperación → enlace → nueva contraseña.
- Código revisado.
- Pipeline pasando (lint + build) (responsable CTO).
- No hay secretos en repositorios.

