# Módulo: Drivers

**Base Path:** `/api/drivers/`  
**Autenticación:** Requerida (Bearer token)

---

## Schema

```typescript
type DriverStatus = 'available' | 'busy' | 'off_duty'

interface UserInfo {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
}

interface Driver {
  id: number
  user: UserInfo
  license_number: string  // único, max 50
  license_expiry: string  // YYYY-MM-DD
  phone: string           // max 30
  status: DriverStatus
  created_at: string      // ISO 8601
  updated_at: string      // ISO 8601
}
```

---

## Endpoints

### GET `/api/drivers/`

**Query params:**
- `?status=available|busy|off_duty`
- `?search=john` — busca en: `user__username`, `user__email`, `license_number`
- `?ordering=created_at|-created_at|status`

**Response 200:** Paginado con `results: Driver[]`

---

### POST `/api/drivers/`

Crea driver **y** su cuenta de usuario Django automáticamente.

**Body:**
```json
{
  "username": "jsmith",
  "password": "securepass123",
  "email": "jsmith@example.com",
  "first_name": "John",
  "last_name": "Smith",
  "license_number": "DL-2026-00001",
  "license_expiry": "2028-06-15",
  "phone": "+19876543210",
  "status": "available"
}
```

**Response 201:** `Driver`

**Validaciones (en create todos son requeridos):**
- `username`, `password`, `license_number`, `license_expiry`, `phone` — obligatorios
- `username` debe ser único
- `license_number` debe ser único
- `password` mínimo 8 caracteres

---

### GET `/api/drivers/{id}/`

**Response 200:** `Driver`

---

### PATCH `/api/drivers/{id}/`

Campos actualizables: `email`, `first_name`, `last_name`, `license_number`, `license_expiry`, `phone`, `status`.  
No se puede cambiar `username` ni `password` por este endpoint.

**Response 200:** `Driver` actualizado

---

### PUT `/api/drivers/{id}/`

**Response 200:** `Driver` actualizado

---

### DELETE `/api/drivers/{id}/`

**Response 204:** Sin contenido  
**Efecto:** Elimina también la cuenta de usuario Django asociada.

---

## Notas de Integración

- Los drivers se asignan a `Transport` vía `/api/transport/{id}/assign-driver/`
- Un driver con `status: busy` ya está asignado a un vehículo en operación
- El `status` del driver es independiente del `status` del vehículo
