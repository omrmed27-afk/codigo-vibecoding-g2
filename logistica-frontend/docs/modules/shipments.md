# Módulo: Shipments

**Base Path:** `/api/shipments/`  
**Autenticación:** Requerida (Bearer token)  
**Nota:** Entidad central del sistema. Orquesta customers, products, transport y routes.

---

## Schema

```typescript
type ShipmentStatus = 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'

interface CustomerRef {
  id: number
  name: string
  email: string
}

interface WarehouseRef {
  id: number
  name: string
  city: string
}

interface TransportRef {
  id: number
  name: string
  plate_number: string
  status: 'available' | 'in_transit' | 'maintenance'
}

interface RouteRef {
  id: number
  name: string
  status: 'active' | 'inactive'
}

interface ProductRef {
  id: number
  name: string
  sku: string
  unit_price: string
}

interface ShipmentProduct {
  id: number
  product: ProductRef
  quantity: number
  unit_price_at_shipment: string  // precio capturado al momento del envío
  created_at: string
}

interface Shipment {
  id: number
  tracking_number: string          // auto-generado: "SHIP-YYYYMMDD-XXXXXXXX"
  customer: CustomerRef
  origin_warehouse: WarehouseRef
  destination_address: string      // max 500
  destination_city: string         // max 100
  destination_country: string      // max 100
  status: ShipmentStatus
  transport: TransportRef | null
  route: RouteRef | null
  scheduled_delivery_date: string  // YYYY-MM-DD
  actual_delivery_date: string | null
  weight_kg: string                // decimal
  base_cost: string                // calculado al crear
  calculated_cost: string          // puede diferir de base_cost tras ajustes
  notes: string | null
  shipment_products: ShipmentProduct[]
  created_at: string
  updated_at: string
}
```

---

## Flujo de Estados

```
pending → picked_up → in_transit → delivered
    ↓          ↓           ↓
 cancelled  cancelled  cancelled
```

| Estado | Cómo llegar |
|--------|-------------|
| `pending` | Creación automática |
| `picked_up` | `POST /assign-transport/` |
| `in_transit` | Estado intermedio interno |
| `delivered` | `POST /mark-delivered/` |
| `cancelled` | `POST /cancel/` |

---

## Endpoints

### GET `/api/shipments/`

**Query params:**
- `?status=pending|picked_up|in_transit|delivered|cancelled`
- `?customer=1`
- `?origin_warehouse=1`
- `?transport=1`
- `?search=SHIP-2026` — busca en: `tracking_number`, `destination_city`, `destination_country`
- `?ordering=created_at|-created_at|scheduled_delivery_date|-scheduled_delivery_date|base_cost|-base_cost`

**Response 200:** Paginado con `results: Shipment[]`

---

### POST `/api/shipments/`

**Body:**
```json
{
  "customer": 3,
  "origin_warehouse": 1,
  "destination_address": "456 Business Blvd",
  "destination_city": "Boston",
  "destination_country": "USA",
  "scheduled_delivery_date": "2026-05-25",
  "weight_kg": "15.500",
  "notes": "Handle with care",
  "products": [
    { "product": 5, "quantity": 2 },
    { "product": 8, "quantity": 1 }
  ]
}
```

**Response 201:** `Shipment`

**Auto-generado:**
- `tracking_number` (único)
- `status` = `"pending"`
- `base_cost` (calculado desde `weight_kg`)
- `unit_price_at_shipment` por cada producto (snapshot del precio actual)

**Validaciones:**
- Al menos 1 producto requerido
- No se permiten productos duplicados en el mismo shipment
- `quantity` mínimo 1

---

### GET `/api/shipments/{id}/`

**Response 200:** `Shipment` completo con `shipment_products`

---

### PATCH `/api/shipments/{id}/`

Campos actualizables: `destination_address`, `destination_city`, `destination_country`, `scheduled_delivery_date`, `weight_kg`, `notes`.

**No actualizables vía PATCH:** `status` (usar acciones), `products`, costos calculados.

**Response 200:** `Shipment` actualizado

---

### PUT `/api/shipments/{id}/`

Requiere todos los campos obligatorios (excepto `products`).

**Response 200:** `Shipment` actualizado

---

### DELETE `/api/shipments/{id}/`

**Response 204:** Sin contenido  
**Efecto:** Elimina también todos los `ShipmentProduct` asociados.

---

### POST `/api/shipments/{id}/assign-transport/`

Asigna transporte (y opcionalmente ruta). Cambia status a `picked_up`.

**Body:**
```json
{
  "transport_id": 2,
  "route_id": 1
}
```

**Response 200:** `Shipment` actualizado  
**Validaciones:** `transport_id` requerido; `route_id` opcional

---

### POST `/api/shipments/{id}/mark-delivered/`

Marca como entregado. Registra `actual_delivery_date` = hoy.

**Body:** `{}` (vacío)

**Response 200:** `Shipment` con `status: "delivered"` y `actual_delivery_date` poblado

---

### POST `/api/shipments/{id}/cancel/`

Cancela el shipment.

**Body:** `{}` (vacío)

**Response 200:** `Shipment` con `status: "cancelled"`

---

## Notas de Integración

- El `tracking_number` es el identificador público del shipment (mostrar en UI)
- `base_cost` vs `calculated_cost`: mostrar `calculated_cost` como precio final
- `shipment_products` incluye `unit_price_at_shipment` — precio al momento del envío, puede diferir del precio actual del producto
- Para el formulario de creación: cargar customers, warehouses y products de sus respectivos endpoints
- Para asignar transport: filtrar `?status=available` en `/api/transport/`
