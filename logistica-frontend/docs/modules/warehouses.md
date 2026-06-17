# Módulo: Warehouses

**Base Path:** `/api/warehouses/`  
**Autenticación:** Requerida (Bearer token)

---

## Schema

```typescript
interface Warehouse {
  id: number
  name: string           // max 200
  address: string        // max 500
  city: string           // max 100
  country: string        // max 100
  latitude: string | null   // decimal -90 a 90
  longitude: string | null  // decimal -180 a 180
  is_active: boolean
  created_at: string     // ISO 8601
  updated_at: string     // ISO 8601
}
```

---

## Endpoints

### GET `/api/warehouses/`

**Query params:**
- `?is_active=true|false`
- `?city=Chicago`
- `?country=USA`
- `?search=central` — busca en: `name`, `address`, `city`
- `?ordering=name|-name|created_at|-created_at`

**Response 200:** Paginado con `results: Warehouse[]`

---

### POST `/api/warehouses/`

**Body:**
```json
{
  "name": "Central Warehouse",
  "address": "789 Logistics Blvd",
  "city": "Chicago",
  "country": "USA",
  "latitude": "41.881832",
  "longitude": "-87.629799",
  "is_active": true
}
```

**Response 201:** `Warehouse`

**Validaciones:**
- Si se provee `latitude`, `longitude` es requerido y viceversa
- `latitude`: -90 a 90
- `longitude`: -180 a 180

---

### GET `/api/warehouses/{id}/`

**Response 200:** `Warehouse`

---

### PATCH `/api/warehouses/{id}/`

Actualización parcial.

**Response 200:** `Warehouse` actualizado

---

### PUT `/api/warehouses/{id}/`

Actualización completa.

**Response 200:** `Warehouse` actualizado

---

### DELETE `/api/warehouses/{id}/`

**Response 204:** Sin contenido

---

## Notas de Integración

- Las bodegas son referenciadas por `Products` y `Shipments`
- Filtrar `?is_active=true` para mostrar solo bodegas operativas en formularios de selección
