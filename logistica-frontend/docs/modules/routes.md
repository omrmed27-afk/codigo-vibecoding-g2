# Módulo: Routes

**Base Path:** `/api/routes/`  
**Autenticación:** Requerida (Bearer token)

---

## Schema

```typescript
type RouteStatus = 'active' | 'inactive'

interface RouteStop {
  id: number
  stop_order: number     // único por ruta
  address: string        // max 500
  city: string           // max 100
  latitude: string | null
  longitude: string | null
  created_at: string     // ISO 8601
}

interface WarehouseRef {
  id: number
  name: string
  city: string
}

interface Route {
  id: number
  name: string              // max 200
  origin_warehouse: WarehouseRef
  status: RouteStatus
  stops: RouteStop[]        // ordenadas por stop_order
  created_at: string        // ISO 8601
  updated_at: string        // ISO 8601
}
```

---

## Endpoints

### GET `/api/routes/`

**Query params:**
- `?status=active|inactive`
- `?origin_warehouse=1` — filtrar por ID de bodega origen
- `?search=express` — busca en: `name`
- `?ordering=name|-name|created_at|-created_at`

**Response 200:** Paginado con `results: Route[]` (incluye stops)

---

### POST `/api/routes/`

Se pueden crear las paradas junto con la ruta o agregarlas después.

**Body:**
```json
{
  "name": "Downtown Express",
  "origin_warehouse": 1,
  "status": "active",
  "stops": [
    {
      "stop_order": 1,
      "address": "123 Oak St",
      "city": "New York",
      "latitude": "40.712776",
      "longitude": "-74.005974"
    },
    {
      "stop_order": 2,
      "address": "456 Pine Ave",
      "city": "New York",
      "latitude": "40.720000",
      "longitude": "-74.010000"
    }
  ]
}
```

**Response 201:** `Route` (incluye stops creadas)

---

### GET `/api/routes/{id}/`

**Response 200:** `Route` (incluye stops)

---

### PATCH `/api/routes/{id}/`

Actualiza campos de la ruta (`name`, `origin_warehouse`, `status`).  
Para gestionar stops usar los endpoints de stops.

**Response 200:** `Route` actualizado

---

### PUT `/api/routes/{id}/`

**Response 200:** `Route` actualizado

---

### DELETE `/api/routes/{id}/`

**Response 204:** Sin contenido  
**Efecto:** Elimina también todas las paradas de la ruta (cascade).

---

### GET `/api/routes/{id}/stops/`

Lista paradas de una ruta.

**Response 200:** `RouteStop[]`

---

### POST `/api/routes/{id}/stops/`

Agrega una parada a la ruta.

**Body:**
```json
{
  "stop_order": 3,
  "address": "789 Elm Blvd",
  "city": "New York",
  "latitude": "40.730000",
  "longitude": "-74.020000"
}
```

**Response 201:** `RouteStop`

**Validaciones:**
- `stop_order` debe ser único dentro de la ruta

---

### DELETE `/api/routes/{id}/stops/{stop_pk}/`

**Response 204:** Sin contenido

---

## Notas de Integración

- Las rutas se asignan opcionalmente a `Shipments` en el endpoint `assign-transport`
- `stop_order` define el orden de entrega; renderizar stops ordenadas ascendentemente
- Filtrar `?status=active` en formulario de selección de ruta para shipments
