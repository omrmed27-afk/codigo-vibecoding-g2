# Módulo: Suppliers

**Base Path:** `/api/suppliers/`  
**Autenticación:** Requerida (Bearer token)

---

## Schema

```typescript
interface Supplier {
  id: number
  name: string          // max 200
  contact_name: string  // max 200
  email: string         // único
  phone: string         // max 30
  address: string       // max 500
  city: string          // max 100
  country: string       // max 100
  created_at: string    // ISO 8601
  updated_at: string    // ISO 8601
}
```

---

## Endpoints

### GET `/api/suppliers/`

**Query params:**
- `?city=Los Angeles`
- `?country=USA`
- `?search=tech` — busca en: `name`, `contact_name`, `email`
- `?ordering=name|-name|created_at|-created_at`

**Response 200:** Paginado con `results: Supplier[]`

---

### POST `/api/suppliers/`

**Body:**
```json
{
  "name": "Tech Supplier Inc",
  "contact_name": "John Doe",
  "email": "john@techsupply.com",
  "phone": "+1987654321",
  "address": "456 Industrial Ave",
  "city": "Los Angeles",
  "country": "USA"
}
```

**Response 201:** `Supplier`

**Validaciones:**
- `email` debe ser único

---

### GET `/api/suppliers/{id}/`

**Response 200:** `Supplier`

---

### PATCH `/api/suppliers/{id}/`

Actualización parcial.

**Response 200:** `Supplier` actualizado

---

### PUT `/api/suppliers/{id}/`

Actualización completa.

**Response 200:** `Supplier` actualizado

---

### DELETE `/api/suppliers/{id}/`

**Response 204:** Sin contenido
