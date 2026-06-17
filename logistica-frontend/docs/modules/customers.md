# Módulo: Customers

**Base Path:** `/api/customers/`  
**Autenticación:** Requerida (Bearer token)

---

## Schema

```typescript
type CustomerType = 'company' | 'individual'

interface Customer {
  id: number
  name: string               // max 200
  customer_type: CustomerType
  email: string              // único
  phone: string              // max 30
  address: string            // max 500
  city: string               // max 100
  country: string            // max 100
  tax_id: string | null      // único si presente
  created_at: string         // ISO 8601
  updated_at: string         // ISO 8601
}
```

---

## Endpoints

### GET `/api/customers/`

Lista clientes con paginación.

**Query params:**
- `?customer_type=company|individual`
- `?city=New York`
- `?country=USA`
- `?search=acme` — busca en: `name`, `email`, `phone`
- `?ordering=name|-name|created_at|-created_at`

**Response 200:** Paginado con `results: Customer[]`

---

### POST `/api/customers/`

**Body:**
```json
{
  "name": "Acme Corp",
  "customer_type": "company",
  "email": "contact@acme.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "country": "USA",
  "tax_id": "US12345678"
}
```

**Response 201:** `Customer`

**Validaciones:**
- `email` debe ser único
- `tax_id` debe ser único (si se provee)

---

### GET `/api/customers/{id}/`

**Response 200:** `Customer`

---

### PATCH `/api/customers/{id}/`

Actualización parcial — enviar solo campos a modificar.

**Response 200:** `Customer` actualizado

---

### PUT `/api/customers/{id}/`

Actualización completa — requiere todos los campos obligatorios.

**Response 200:** `Customer` actualizado

---

### DELETE `/api/customers/{id}/`

**Response 204:** Sin contenido
