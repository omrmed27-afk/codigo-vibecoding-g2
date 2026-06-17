# Módulo: Auth

**Base Path:** `/api/auth/`  
**Autenticación:** No requerida (endpoints públicos)

---

## Endpoints

### POST `/api/auth/register/`

Registra nuevo usuario y devuelve tokens listos para usar.

**Body:**
```json
{
  "username": "string (max 150, único)",
  "password": "string (min 8 chars)",
  "email": "email (opcional, único si se provee)",
  "first_name": "string (opcional, max 150)",
  "last_name": "string (opcional, max 150)"
}
```

**Response 201:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string"
  }
}
```

---

### POST `/api/auth/login/`

Obtiene tokens con credenciales.

**Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response 200:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

### POST `/api/auth/refresh/`

Renueva el access token usando el refresh token.

**Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response 200:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

## Notas de Integración

- Access token: expira en 1 hora → usar refresh para renovar
- Refresh token: expira en 7 días → forzar login al expirar
- Almacenar access en memoria (variable de estado/contexto), no en localStorage
- Almacenar refresh en localStorage (persiste entre sesiones)
- Interceptar 401 → intentar refresh → reintentar request original → si falla, redirigir a `/login`
