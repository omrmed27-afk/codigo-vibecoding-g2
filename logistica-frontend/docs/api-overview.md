# API Overview — Logística API

**Stack:** Django 6 · Django REST Framework 3 · SimpleJWT · drf-spectacular  
**Base URL:** `http://localhost:8000/api/`  
**Interactive Docs:** `http://localhost:8000/api/docs/` (Swagger UI)

---

## Auth Header

Todas las rutas (excepto login/register/refresh) requieren:

```
Authorization: Bearer <access_token>
```

---

## Módulos

| Módulo | Base Path | Doc detallada |
|--------|-----------|---------------|
| Auth | `/api/auth/` | `modules/auth.md` |
| Customers | `/api/customers/` | `modules/customers.md` |
| Suppliers | `/api/suppliers/` | `modules/suppliers.md` |
| Warehouses | `/api/warehouses/` | `modules/warehouses.md` |
| Products | `/api/products/` | `modules/products.md` |
| Drivers | `/api/drivers/` | `modules/drivers.md` |
| Transport | `/api/transport/` | `modules/transport.md` |
| Routes | `/api/routes/` | `modules/routes.md` |
| Shipments | `/api/shipments/` | `modules/shipments.md` |

---

## Paginación

Todos los listados usan paginación con 20 ítems por página:

```json
{
  "count": 42,
  "next": "http://localhost:8000/api/customers/?page=2",
  "previous": null,
  "results": [...]
}
```

**Query params comunes:**
- `?page=2` — número de página
- `?search=texto` — búsqueda full-text (campos varían por módulo)
- `?ordering=campo` / `?ordering=-campo` — ordenamiento (- = descendente)
- `?campo=valor` — filtros específicos por módulo

---

## Formato de Error

```json
{
  "error": {
    "code": "validation_error|authentication_required|permission_denied|not_found|server_error",
    "message": "Descripción del error",
    "details": { "field_name": ["Error detallado"] }
  }
}
```

---

## Códigos HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK — GET, PATCH, PUT exitoso |
| 201 | Created — POST exitoso |
| 204 | No Content — DELETE exitoso |
| 400 | Bad Request — validación fallida |
| 401 | Unauthorized — token faltante o inválido |
| 403 | Forbidden — permisos insuficientes |
| 404 | Not Found — recurso no existe |
| 409 | Conflict — regla de negocio violada |
| 500 | Server Error — error interno |

---

## Tipos de Datos

| Tipo | Formato en JSON | Ejemplo |
|------|-----------------|---------|
| `date` | String YYYY-MM-DD | `"2026-05-27"` |
| `datetime` | ISO 8601 UTC | `"2026-05-27T14:30:00Z"` |
| `decimal` | String numérico | `"1299.99"` |
| `integer` | Número | `42` |
| `boolean` | true/false | `true` |

---

## Flujo de Autenticación

```
1. POST /api/auth/login/ → { access, refresh }
2. Guardar access en memoria, refresh en localStorage
3. En cada request → Authorization: Bearer <access>
4. Si 401 → POST /api/auth/refresh/ con { refresh } → nuevo access
5. Si refresh expirado → redirigir a login
```

Access token: válido 1 hora  
Refresh token: válido 7 días

---

## Flujo de Negocio Principal (Shipment)

```
pending → picked_up → in_transit → delivered
                                 → cancelled
```

1. Crear shipment → status: `pending`
2. Asignar transporte → `POST /api/shipments/{id}/assign-transport/` → status: `picked_up`
3. Marcar entregado → `POST /api/shipments/{id}/mark-delivered/` → status: `delivered`
4. Cancelar → `POST /api/shipments/{id}/cancel/` → status: `cancelled`

---

---

# Referencia Completa de Endpoints

---

## AUTH

### POST `/api/auth/register/`

**Body:**
```json
{
  "username": "jdoe",
  "password": "securepass123",
  "email": "jdoe@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response 201:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "jdoe",
    "email": "jdoe@example.com"
  }
}
```

---

### POST `/api/auth/login/`

**Body:**
```json
{
  "username": "jdoe",
  "password": "securepass123"
}
```

**Response 200:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### POST `/api/auth/refresh/`

**Body:**
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## CUSTOMERS

### GET `/api/customers/`

**Response 200:**
```json
{
  "count": 42,
  "next": "http://localhost:8000/api/customers/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Acme Corp",
      "customer_type": "company",
      "email": "contact@acme.com",
      "phone": "+1234567890",
      "address": "123 Main St",
      "city": "New York",
      "country": "USA",
      "tax_id": "US12345678",
      "created_at": "2026-05-20T10:30:00Z",
      "updated_at": "2026-05-20T10:30:00Z"
    }
  ]
}
```

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

**Response 201:**
```json
{
  "id": 1,
  "name": "Acme Corp",
  "customer_type": "company",
  "email": "contact@acme.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "country": "USA",
  "tax_id": "US12345678",
  "created_at": "2026-05-27T14:00:00Z",
  "updated_at": "2026-05-27T14:00:00Z"
}
```

---

### GET `/api/customers/{id}/`

**Response 200:** mismo objeto que POST 201

---

### PATCH `/api/customers/{id}/`

**Body** (campos parciales):
```json
{
  "phone": "+1987654321",
  "city": "Boston"
}
```

**Response 200:** objeto Customer actualizado

---

### PUT `/api/customers/{id}/`

**Body** (todos los campos obligatorios):
```json
{
  "name": "Acme Corp Updated",
  "customer_type": "company",
  "email": "contact@acme.com",
  "phone": "+1987654321",
  "address": "456 New Ave",
  "city": "Boston",
  "country": "USA",
  "tax_id": "US12345678"
}
```

**Response 200:** objeto Customer actualizado

---

### DELETE `/api/customers/{id}/`

**Response 204:** sin body

---

## SUPPLIERS

### GET `/api/suppliers/`

**Response 200:**
```json
{
  "count": 15,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Tech Supplier Inc",
      "contact_name": "John Doe",
      "email": "john@techsupply.com",
      "phone": "+1987654321",
      "address": "456 Industrial Ave",
      "city": "Los Angeles",
      "country": "USA",
      "created_at": "2026-05-15T14:20:00Z",
      "updated_at": "2026-05-15T14:20:00Z"
    }
  ]
}
```

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

**Response 201:**
```json
{
  "id": 1,
  "name": "Tech Supplier Inc",
  "contact_name": "John Doe",
  "email": "john@techsupply.com",
  "phone": "+1987654321",
  "address": "456 Industrial Ave",
  "city": "Los Angeles",
  "country": "USA",
  "created_at": "2026-05-27T14:00:00Z",
  "updated_at": "2026-05-27T14:00:00Z"
}
```

---

### GET `/api/suppliers/{id}/`

**Response 200:** mismo objeto que POST 201

---

### PATCH `/api/suppliers/{id}/`

**Body** (campos parciales):
```json
{
  "contact_name": "Jane Doe",
  "phone": "+1555000000"
}
```

**Response 200:** objeto Supplier actualizado

---

### PUT `/api/suppliers/{id}/`

**Body** (todos los campos obligatorios):
```json
{
  "name": "Tech Supplier Inc",
  "contact_name": "Jane Doe",
  "email": "jane@techsupply.com",
  "phone": "+1555000000",
  "address": "456 Industrial Ave",
  "city": "Los Angeles",
  "country": "USA"
}
```

**Response 200:** objeto Supplier actualizado

---

### DELETE `/api/suppliers/{id}/`

**Response 204:** sin body

---

## WAREHOUSES

### GET `/api/warehouses/`

**Response 200:**
```json
{
  "count": 8,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Central Warehouse",
      "address": "789 Logistics Blvd",
      "city": "Chicago",
      "country": "USA",
      "latitude": "41.881832",
      "longitude": "-87.629799",
      "is_active": true,
      "created_at": "2026-05-10T08:15:00Z",
      "updated_at": "2026-05-10T08:15:00Z"
    }
  ]
}
```

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

**Response 201:**
```json
{
  "id": 1,
  "name": "Central Warehouse",
  "address": "789 Logistics Blvd",
  "city": "Chicago",
  "country": "USA",
  "latitude": "41.881832",
  "longitude": "-87.629799",
  "is_active": true,
  "created_at": "2026-05-27T14:00:00Z",
  "updated_at": "2026-05-27T14:00:00Z"
}
```

---

### GET `/api/warehouses/{id}/`

**Response 200:** mismo objeto que POST 201

---

### PATCH `/api/warehouses/{id}/`

**Body** (campos parciales):
```json
{
  "is_active": false
}
```

**Response 200:** objeto Warehouse actualizado

---

### PUT `/api/warehouses/{id}/`

**Body** (todos los campos obligatorios):
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

**Response 200:** objeto Warehouse actualizado

---

### DELETE `/api/warehouses/{id}/`

**Response 204:** sin body

---

## PRODUCTS

### GET `/api/products/`

**Response 200:**
```json
{
  "count": 123,
  "next": "http://localhost:8000/api/products/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Laptop Pro",
      "description": "High-performance laptop",
      "sku": "LP-2026-001",
      "weight_kg": "1.500",
      "width_cm": "35.50",
      "height_cm": "23.00",
      "depth_cm": "18.50",
      "unit_price": "1299.99",
      "stock_quantity": 45,
      "supplier": {
        "id": 1,
        "name": "Tech Supplier Inc"
      },
      "warehouse": {
        "id": 1,
        "name": "Central Warehouse"
      },
      "created_at": "2026-05-12T09:00:00Z",
      "updated_at": "2026-05-12T09:00:00Z"
    }
  ]
}
```

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

**Response 201:**
```json
{
  "id": 1,
  "name": "Laptop Pro",
  "description": "High-performance laptop",
  "sku": "LP-2026-001",
  "weight_kg": "1.500",
  "width_cm": "35.50",
  "height_cm": "23.00",
  "depth_cm": "18.50",
  "unit_price": "1299.99",
  "stock_quantity": 45,
  "supplier": {
    "id": 1,
    "name": "Tech Supplier Inc"
  },
  "warehouse": {
    "id": 1,
    "name": "Central Warehouse"
  },
  "created_at": "2026-05-27T14:00:00Z",
  "updated_at": "2026-05-27T14:00:00Z"
}
```

---

### GET `/api/products/{id}/`

**Response 200:** mismo objeto que POST 201

---

### PATCH `/api/products/{id}/`

**Body** (campos parciales):
```json
{
  "unit_price": "1199.99",
  "stock_quantity": 30
}
```

**Response 200:** objeto Product actualizado

---

### PUT `/api/products/{id}/`

**Body** (todos los campos obligatorios):
```json
{
  "name": "Laptop Pro",
  "description": "High-performance laptop",
  "sku": "LP-2026-001",
  "weight_kg": "1.500",
  "width_cm": "35.50",
  "height_cm": "23.00",
  "depth_cm": "18.50",
  "unit_price": "1199.99",
  "stock_quantity": 30,
  "supplier": 1,
  "warehouse": 1
}
```

**Response 200:** objeto Product actualizado

---

### DELETE `/api/products/{id}/`

**Response 204:** sin body

---

## DRIVERS

### GET `/api/drivers/`

**Response 200:**
```json
{
  "count": 12,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": {
        "id": 5,
        "username": "jsmith",
        "email": "jsmith@example.com",
        "first_name": "John",
        "last_name": "Smith"
      },
      "license_number": "DL-2026-00001",
      "license_expiry": "2028-06-15",
      "phone": "+19876543210",
      "status": "available",
      "created_at": "2026-05-18T11:30:00Z",
      "updated_at": "2026-05-18T11:30:00Z"
    }
  ]
}
```

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

**Response 201:**
```json
{
  "id": 1,
  "user": {
    "id": 5,
    "username": "jsmith",
    "email": "jsmith@example.com",
    "first_name": "John",
    "last_name": "Smith"
  },
  "license_number": "DL-2026-00001",
  "license_expiry": "2028-06-15",
  "phone": "+19876543210",
  "status": "available",
  "created_at": "2026-05-27T14:00:00Z",
  "updated_at": "2026-05-27T14:00:00Z"
}
```

---

### GET `/api/drivers/{id}/`

**Response 200:** mismo objeto que POST 201

---

### PATCH `/api/drivers/{id}/`

**Body** (campos parciales — no incluye username/password):
```json
{
  "phone": "+10000000001",
  "status": "off_duty",
  "license_expiry": "2029-06-15"
}
```

**Response 200:** objeto Driver actualizado

---

### PUT `/api/drivers/{id}/`

**Body:**
```json
{
  "email": "jsmith@example.com",
  "first_name": "John",
  "last_name": "Smith",
  "license_number": "DL-2026-00001",
  "license_expiry": "2029-06-15",
  "phone": "+10000000001",
  "status": "off_duty"
}
```

**Response 200:** objeto Driver actualizado

---

### DELETE `/api/drivers/{id}/`

**Response 204:** sin body — también elimina el usuario Django asociado

---

## TRANSPORT

### GET `/api/transport/`

**Response 200:**
```json
{
  "count": 20,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Truck A1",
      "type": "truck",
      "plate_number": "ABC-1234",
      "capacity_kg": "5000.00",
      "capacity_m3": "12.500",
      "driver": {
        "id": 1,
        "license_number": "DL-2026-00001",
        "phone": "+19876543210",
        "status": "available"
      },
      "status": "available",
      "created_at": "2026-05-16T13:45:00Z",
      "updated_at": "2026-05-16T13:45:00Z"
    }
  ]
}
```

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

**Response 201:**
```json
{
  "id": 1,
  "name": "Truck A1",
  "type": "truck",
  "plate_number": "ABC-1234",
  "capacity_kg": "5000.00",
  "capacity_m3": "12.500",
  "driver": {
    "id": 1,
    "license_number": "DL-2026-00001",
    "phone": "+19876543210",
    "status": "available"
  },
  "status": "available",
  "created_at": "2026-05-27T14:00:00Z",
  "updated_at": "2026-05-27T14:00:00Z"
}
```

---

### GET `/api/transport/{id}/`

**Response 200:** mismo objeto que POST 201

---

### PATCH `/api/transport/{id}/`

**Body** (campos parciales):
```json
{
  "status": "maintenance"
}
```

**Response 200:** objeto Transport actualizado

---

### PUT `/api/transport/{id}/`

**Body** (todos los campos obligatorios):
```json
{
  "name": "Truck A1",
  "type": "truck",
  "plate_number": "ABC-1234",
  "capacity_kg": "5000.00",
  "capacity_m3": "12.500",
  "driver": 1,
  "status": "maintenance"
}
```

**Response 200:** objeto Transport actualizado

---

### DELETE `/api/transport/{id}/`

**Response 204:** sin body

---

### POST `/api/transport/{id}/assign-driver/`

**Body:**
```json
{
  "driver_id": 2
}
```

**Response 200:**
```json
{
  "id": 1,
  "name": "Truck A1",
  "type": "truck",
  "plate_number": "ABC-1234",
  "capacity_kg": "5000.00",
  "capacity_m3": "12.500",
  "driver": {
    "id": 2,
    "license_number": "DL-2026-00002",
    "phone": "+10000000002",
    "status": "available"
  },
  "status": "available",
  "created_at": "2026-05-27T14:00:00Z",
  "updated_at": "2026-05-27T15:00:00Z"
}
```

---

### POST `/api/transport/{id}/unassign-driver/`

**Body:** `{}`

**Response 200:**
```json
{
  "id": 1,
  "name": "Truck A1",
  "type": "truck",
  "plate_number": "ABC-1234",
  "capacity_kg": "5000.00",
  "capacity_m3": "12.500",
  "driver": null,
  "status": "available",
  "created_at": "2026-05-27T14:00:00Z",
  "updated_at": "2026-05-27T15:30:00Z"
}
```

---

## ROUTES

### GET `/api/routes/`

**Response 200:**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Downtown Express",
      "origin_warehouse": {
        "id": 1,
        "name": "Central Warehouse",
        "city": "Chicago"
      },
      "status": "active",
      "stops": [
        {
          "id": 101,
          "stop_order": 1,
          "address": "123 Oak St",
          "city": "New York",
          "latitude": "40.712776",
          "longitude": "-74.005974",
          "created_at": "2026-05-17T10:00:00Z"
        },
        {
          "id": 102,
          "stop_order": 2,
          "address": "456 Pine Ave",
          "city": "New York",
          "latitude": "40.720000",
          "longitude": "-74.010000",
          "created_at": "2026-05-17T10:05:00Z"
        }
      ],
      "created_at": "2026-05-17T10:00:00Z",
      "updated_at": "2026-05-17T10:00:00Z"
    }
  ]
}
```

---

### POST `/api/routes/`

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

**Response 201:**
```json
{
  "id": 1,
  "name": "Downtown Express",
  "origin_warehouse": {
    "id": 1,
    "name": "Central Warehouse",
    "city": "Chicago"
  },
  "status": "active",
  "stops": [
    {
      "id": 101,
      "stop_order": 1,
      "address": "123 Oak St",
      "city": "New York",
      "latitude": "40.712776",
      "longitude": "-74.005974",
      "created_at": "2026-05-27T14:00:00Z"
    },
    {
      "id": 102,
      "stop_order": 2,
      "address": "456 Pine Ave",
      "city": "New York",
      "latitude": "40.720000",
      "longitude": "-74.010000",
      "created_at": "2026-05-27T14:00:00Z"
    }
  ],
  "created_at": "2026-05-27T14:00:00Z",
  "updated_at": "2026-05-27T14:00:00Z"
}
```

---

### GET `/api/routes/{id}/`

**Response 200:** mismo objeto que POST 201 (incluye stops)

---

### PATCH `/api/routes/{id}/`

**Body** (campos parciales — no gestiona stops aquí):
```json
{
  "status": "inactive"
}
```

**Response 200:** objeto Route actualizado

---

### PUT `/api/routes/{id}/`

**Body:**
```json
{
  "name": "Downtown Express",
  "origin_warehouse": 1,
  "status": "inactive"
}
```

**Response 200:** objeto Route actualizado

---

### DELETE `/api/routes/{id}/`

**Response 204:** sin body — también elimina todas las stops (cascade)

---

### GET `/api/routes/{id}/stops/`

**Response 200:**
```json
[
  {
    "id": 101,
    "stop_order": 1,
    "address": "123 Oak St",
    "city": "New York",
    "latitude": "40.712776",
    "longitude": "-74.005974",
    "created_at": "2026-05-17T10:00:00Z"
  },
  {
    "id": 102,
    "stop_order": 2,
    "address": "456 Pine Ave",
    "city": "New York",
    "latitude": "40.720000",
    "longitude": "-74.010000",
    "created_at": "2026-05-17T10:05:00Z"
  }
]
```

---

### POST `/api/routes/{id}/stops/`

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

**Response 201:**
```json
{
  "id": 103,
  "stop_order": 3,
  "address": "789 Elm Blvd",
  "city": "New York",
  "latitude": "40.730000",
  "longitude": "-74.020000",
  "created_at": "2026-05-27T15:00:00Z"
}
```

---

### DELETE `/api/routes/{id}/stops/{stop_pk}/`

**Response 204:** sin body

---

## SHIPMENTS

### GET `/api/shipments/`

**Response 200:**
```json
{
  "count": 156,
  "next": "http://localhost:8000/api/shipments/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "tracking_number": "SHIP-20260519-A3B4C5D6",
      "customer": {
        "id": 3,
        "name": "Acme Corp",
        "email": "contact@acme.com"
      },
      "origin_warehouse": {
        "id": 1,
        "name": "Central Warehouse",
        "city": "Chicago"
      },
      "destination_address": "456 Business Blvd",
      "destination_city": "Boston",
      "destination_country": "USA",
      "status": "pending",
      "transport": null,
      "route": null,
      "scheduled_delivery_date": "2026-05-25",
      "actual_delivery_date": null,
      "weight_kg": "15.500",
      "base_cost": "125.50",
      "calculated_cost": "125.50",
      "notes": "Handle with care",
      "shipment_products": [
        {
          "id": 10,
          "product": {
            "id": 5,
            "name": "Laptop Pro",
            "sku": "LP-2026-001",
            "unit_price": "1299.99"
          },
          "quantity": 2,
          "unit_price_at_shipment": "1299.99",
          "created_at": "2026-05-19T14:30:00Z"
        }
      ],
      "created_at": "2026-05-19T14:30:00Z",
      "updated_at": "2026-05-19T14:30:00Z"
    }
  ]
}
```

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

**Response 201:**
```json
{
  "id": 1,
  "tracking_number": "SHIP-20260527-A3B4C5D6",
  "customer": {
    "id": 3,
    "name": "Acme Corp",
    "email": "contact@acme.com"
  },
  "origin_warehouse": {
    "id": 1,
    "name": "Central Warehouse",
    "city": "Chicago"
  },
  "destination_address": "456 Business Blvd",
  "destination_city": "Boston",
  "destination_country": "USA",
  "status": "pending",
  "transport": null,
  "route": null,
  "scheduled_delivery_date": "2026-05-25",
  "actual_delivery_date": null,
  "weight_kg": "15.500",
  "base_cost": "125.50",
  "calculated_cost": "125.50",
  "notes": "Handle with care",
  "shipment_products": [
    {
      "id": 10,
      "product": {
        "id": 5,
        "name": "Laptop Pro",
        "sku": "LP-2026-001",
        "unit_price": "1299.99"
      },
      "quantity": 2,
      "unit_price_at_shipment": "1299.99",
      "created_at": "2026-05-27T14:00:00Z"
    },
    {
      "id": 11,
      "product": {
        "id": 8,
        "name": "Mouse Pro",
        "sku": "MP-2026-008",
        "unit_price": "49.99"
      },
      "quantity": 1,
      "unit_price_at_shipment": "49.99",
      "created_at": "2026-05-27T14:00:00Z"
    }
  ],
  "created_at": "2026-05-27T14:00:00Z",
  "updated_at": "2026-05-27T14:00:00Z"
}
```

---

### GET `/api/shipments/{id}/`

**Response 200:** mismo objeto que POST 201

---

### PATCH `/api/shipments/{id}/`

**Body** (campos editables — status y products NO se editan aquí):
```json
{
  "destination_city": "Cambridge",
  "scheduled_delivery_date": "2026-05-28",
  "notes": "Updated: fragile items"
}
```

**Response 200:** objeto Shipment actualizado

---

### PUT `/api/shipments/{id}/`

**Body** (todos los campos obligatorios — sin products):
```json
{
  "customer": 3,
  "origin_warehouse": 1,
  "destination_address": "456 Business Blvd",
  "destination_city": "Cambridge",
  "destination_country": "USA",
  "scheduled_delivery_date": "2026-05-28",
  "weight_kg": "15.500",
  "notes": "Updated: fragile items"
}
```

**Response 200:** objeto Shipment actualizado

---

### DELETE `/api/shipments/{id}/`

**Response 204:** sin body — también elimina todos los ShipmentProduct asociados

---

### POST `/api/shipments/{id}/assign-transport/`

**Body:**
```json
{
  "transport_id": 2,
  "route_id": 1
}
```

**Response 200:**
```json
{
  "id": 1,
  "tracking_number": "SHIP-20260527-A3B4C5D6",
  "status": "picked_up",
  "transport": {
    "id": 2,
    "name": "Van B1",
    "plate_number": "XYZ-5678",
    "status": "in_transit"
  },
  "route": {
    "id": 1,
    "name": "Downtown Express",
    "status": "active"
  },
  "...": "resto del objeto Shipment"
}
```

---

### POST `/api/shipments/{id}/mark-delivered/`

**Body:** `{}`

**Response 200:**
```json
{
  "id": 1,
  "tracking_number": "SHIP-20260527-A3B4C5D6",
  "status": "delivered",
  "actual_delivery_date": "2026-05-27",
  "...": "resto del objeto Shipment"
}
```

---

### POST `/api/shipments/{id}/cancel/`

**Body:** `{}`

**Response 200:**
```json
{
  "id": 1,
  "tracking_number": "SHIP-20260527-A3B4C5D6",
  "status": "cancelled",
  "...": "resto del objeto Shipment"
}
```
