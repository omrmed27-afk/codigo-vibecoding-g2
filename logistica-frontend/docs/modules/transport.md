# Módulo: Transport

**Base Path:** `/api/transport/`  
**Autenticación:** Requerida (Bearer token)

---

## Schema

```typescript
type VehicleType = 'truck' | 'van' | 'motorcycle' | 'bicycle'
type TransportStatus = 'available' | 'in_transit' | 'maintenance'
type DriverStatus = 'available' | 'busy' | 'off_duty'

interface DriverRef {
  id: number
  license_number: string
  phone: string
  status: DriverStatus
}

interface Transport {
  id: number
  name: string             // max 200
  type: VehicleType
  plate_number: string     // único, max 20
  capacity_kg: string      // decimal max_digits=8, decimal_places=2
  capacity_m3: string      // decimal max_digits=8, decimal_places=3
  driver: DriverRef | null
  status: TransportStatus
  created_at: string       // ISO 8601
  updated_at: string       // ISO 8601
}
```

---

## Endpoints

### GET `/api/transport/`

**Query params:**
- `?status=available|in_transit|maintenance`
- `?type=truck|van|motorcycle|bicycle`
- `?driver=1` — filtrar por ID de driver
- `?search=truck` — busca en: `name`, `plate_number`
- `?ordering=name|-name|created_at|-created_at|status`

**Response 200:** Paginado con `results: Transport[]`

---

### POST `/api/transport/`

**Body:**
```json
{
  "name": "Truck A1",
  "type": "truck",
  "plate_number": "ABC-1234",
  "capacity_kg": "5000.00",
  "capacity_m3": "12.500",
  "driver": 1,
  "status": "available"
}
```

**Response 201:** `Transport`

**Validaciones:**
- `plate_number` debe ser único
- `driver` es opcional (puede ser null)

---

### GET `/api/transport/{id}/`

**Response 200:** `Transport`

---

### PATCH `/api/transport/{id}/`

Actualización parcial.

**Response 200:** `Transport` actualizado

---

### PUT `/api/transport/{id}/`

Actualización completa.

**Response 200:** `Transport` actualizado

---

### DELETE `/api/transport/{id}/`

**Response 204:** Sin contenido

---

### POST `/api/transport/{id}/assign-driver/`

Asigna un driver al vehículo.

**Body:**
```json
{
  "driver_id": 1
}
```

**Response 200:** `Transport` actualizado con driver asignado

**Validaciones:** `driver_id` requerido, driver debe existir

---

### POST `/api/transport/{id}/unassign-driver/`

Desasigna el driver del vehículo.

**Body:** `{}` (vacío)

**Response 200:** `Transport` con `driver: null`

---

## Notas de Integración

- Los transportes se asignan a `Shipments` vía `/api/shipments/{id}/assign-transport/`
- Filtrar `?status=available` para mostrar vehículos disponibles en formulario de asignación
- `capacity_kg` y `capacity_m3` pueden usarse para validar que el shipment cabe en el vehículo (lógica en frontend)
