# Módulo: Products

**Base Path:** `/api/products/`  
**Autenticación:** Requerida (Bearer token)

---

## Schema

```typescript
interface ProductRef {
  id: number
  name: string
}

interface Product {
  id: number
  name: string            // max 200
  description: string | null
  sku: string             // único, max 100
  weight_kg: string       // decimal max_digits=8, decimal_places=3
  width_cm: string        // decimal max_digits=8, decimal_places=2
  height_cm: string       // decimal max_digits=8, decimal_places=2
  depth_cm: string        // decimal max_digits=8, decimal_places=2
  unit_price: string      // decimal max_digits=12, decimal_places=2
  stock_quantity: number  // entero, default 0
  supplier: ProductRef
  warehouse: ProductRef
  created_at: string      // ISO 8601
  updated_at: string      // ISO 8601
}
```

---

## Endpoints

### GET `/api/products/`

**Query params:**
- `?supplier=1` — filtrar por ID de supplier
- `?warehouse=1` — filtrar por ID de warehouse
- `?search=laptop` — busca en: `name`, `sku`, `description`
- `?ordering=name|-name|unit_price|-unit_price|stock_quantity|-stock_quantity|created_at|-created_at`

**Response 200:** Paginado con `results: Product[]`

---

### POST `/api/products/`

**Body:**
```json
{
  "name": "Laptop Pro",
  "description": "High-performance laptop",
  "sku": "LP-2026-001",
  "weight_kg": "1.500",
  "width_cm": "35.50",
  "height_cm": "23.00",
  "depth_cm": "18.50",
  "unit_price": "1299.99",
  "stock_quantity": 45,
  "supplier": 1,
  "warehouse": 1
}
```

**Response 201:** `Product`

**Validaciones:**
- `sku` debe ser único
- `supplier` y `warehouse` deben existir

---

### GET `/api/products/{id}/`

**Response 200:** `Product`

---

### PATCH `/api/products/{id}/`

Actualización parcial.

**Response 200:** `Product` actualizado

---

### PUT `/api/products/{id}/`

Actualización completa.

**Response 200:** `Product` actualizado

---

### DELETE `/api/products/{id}/`

**Response 204:** Sin contenido

---

## Notas de Integración

- Los productos se referencian en `Shipments` como `shipment_products` con `quantity` y `unit_price_at_shipment`
- Al crear un Shipment, se envía `product` (id) + `quantity`; el precio se captura automáticamente desde `unit_price`
- Un mismo producto no puede aparecer dos veces en un mismo shipment
