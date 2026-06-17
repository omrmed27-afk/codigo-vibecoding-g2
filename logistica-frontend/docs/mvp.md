# MVP — Logistics Frontend

Fuente de verdad para el Orchester agent. Define el orden de construcción y el estado actual de cada módulo.

---

## Estado de Módulos

| # | Módulo | Status | Spec | Dependencias |
|---|--------|--------|------|--------------|
| 1 | auth | done | docs/specs/auth-spec.md | — |
| 2 | warehouses | done | docs/specs/warehouses-spec.md | auth |
| 3 | suppliers | done | docs/specs/suppliers-spec.md | auth |
| 4 | customers | done | docs/specs/customers-spec.md | auth |
| 5 | products | done | docs/specs/products-spec.md | warehouses, suppliers |
| 6 | drivers | done | docs/specs/drivers-spec.md | auth |
| 7 | transport | done | docs/specs/transport-spec.md | drivers |
| 8 | routes | done | docs/specs/routes-spec.md | warehouses |
| 9 | shipments | done | docs/specs/shipments-spec.md | customers, products, transport, routes |

**Status values:** `not started` | `spec pending approval` | `spec approved` | `in progress` | `done` | `needs fixes`

---

## Descripciones de Módulos

### auth
JWT authentication flow. Login y register pages. Access token en Zustand (memoria, nunca localStorage). Refresh token en localStorage con key `refresh_token`. Silent refresh en page reload via `initFromStorage()`. Escribe cookie `is_logged_in=1` al login para que proxy.ts pueda hacer el guard de rutas.

**Pages:** `/login`, `/register`
**Key components:** LoginForm, RegisterForm
**Features:**
- Login con username + password
- Register nueva cuenta → tokens inmediatos
- Redirect a `/shipments` en login exitoso
- Silent refresh al recargar página
- Redirect a `/login` cuando refresh expira

---

### warehouses
CRUD simple para bodegas/almacenes. Referenciado por Products, Routes y Shipments.

**Pages:** `/warehouses`, `/warehouses/new`, `/warehouses/[id]`, `/warehouses/[id]/edit`
**Key components:** WarehousesTable, WarehouseForm
**Features:**
- Lista paginada con search (name, address, city) y filtro is_active
- Crear, editar, eliminar
- Toggle is_active via Switch
- Campos lat/lng opcionales (si uno presente, ambos requeridos)
- Ordenamiento por name, created_at

---

### suppliers
CRUD simple para proveedores de productos.

**Pages:** `/suppliers`, `/suppliers/new`, `/suppliers/[id]`, `/suppliers/[id]/edit`
**Key components:** SuppliersTable, SupplierForm
**Features:**
- Lista paginada con search (name, contact_name, email)
- Crear, editar, eliminar
- Filtros: city, country

---

### customers
CRUD para clientes de envíos. customer_type: company | individual.

**Pages:** `/customers`, `/customers/new`, `/customers/[id]`, `/customers/[id]/edit`
**Key components:** CustomersTable, CustomerForm
**Features:**
- Lista paginada con search y filtro customer_type
- Crear, editar, eliminar
- customer_type badge (StatusBadge)
- Filtros: customer_type, city, country

---

### products
CRUD para productos. Depende de Suppliers y Warehouses (selects).

**Pages:** `/products`, `/products/new`, `/products/[id]`, `/products/[id]/edit`
**Key components:** ProductsTable, ProductForm
**Features:**
- Lista paginada con search y filtros por supplier/warehouse
- Crear, editar, eliminar
- Campos decimales: weight_kg, width_cm, height_cm, depth_cm, unit_price (todos string en API)
- Select de supplier y warehouse (cargados de sus respectivos endpoints)
- SKU único — manejar error 400 de duplicado

---

### drivers
CRUD especial: POST crea usuario Django automáticamente. DELETE también elimina el usuario.

**Pages:** `/drivers`, `/drivers/new`, `/drivers/[id]`, `/drivers/[id]/edit`
**Key components:** DriversTable, DriverForm
**Features:**
- Lista paginada con filtro status (available|busy|off_duty)
- Crear (incluye username + password fields)
- Editar (sin username/password — no editables por este endpoint)
- Eliminar (advertir que borra el usuario también)
- Status badge: available | busy | off_duty
- license_expiry: date picker

---

### transport
CRUD para vehículos. Acciones extra: assign-driver y unassign-driver.

**Pages:** `/transport`, `/transport/new`, `/transport/[id]`, `/transport/[id]/edit`
**Key components:** TransportTable, TransportForm, AssignDriverDialog
**Features:**
- Lista paginada con filtros status y type
- Crear, editar, eliminar
- Assign driver: dialog con select de drivers disponibles → POST /assign-driver/
- Unassign driver: botón de confirmación → POST /unassign-driver/
- type badge: truck | van | motorcycle | bicycle
- status badge: available | in_transit | maintenance
- Campos decimales: capacity_kg, capacity_m3

---

### routes
CRUD para rutas de entrega con gestión de stops anidadas.

**Pages:** `/routes`, `/routes/new`, `/routes/[id]`, `/routes/[id]/edit`
**Key components:** RoutesTable, RouteForm, StopsManager
**Features:**
- Lista paginada con filtros status y origin_warehouse
- Crear ruta con stops inline (useFieldArray)
- Editar ruta: campos de ruta via PATCH; stops via endpoints separados (GET/POST/DELETE /stops/)
- Agregar/eliminar stops individualmente en edit view
- Stops ordenadas por stop_order (mostrar en orden ascendente)
- status badge: active | inactive
- Select de origin_warehouse

---

### shipments
Entidad central. Workflow de estados. Formulario multi-producto.

**Pages:** `/shipments`, `/shipments/new`, `/shipments/[id]`, `/shipments/[id]/edit`
**Key components:** ShipmentsTable, ShipmentForm, ShipmentDetail, AssignTransportDialog, StatusTimeline
**Features:**
- Lista paginada con filtros: status, customer, origin_warehouse, transport
- Crear: multi-product selection con combobox + search, cantidad por producto
- Editar: solo campos editables (destination, date, weight, notes — NO status ni products)
- Assign transport: dialog → select transport disponible + route opcional → POST /assign-transport/
- Mark delivered: botón con confirmación → POST /mark-delivered/
- Cancel: botón con confirmación → POST /cancel/
- Status workflow visual (timeline o stepper)
- tracking_number prominente en detail view
- shipment_products table en detail view
- Filtros en URL
