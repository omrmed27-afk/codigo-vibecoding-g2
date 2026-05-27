# Database Schema — Logistics API

## Descripción general

Schema completo de la base de datos relacional para la API REST de logística construida con Django 6 + Django REST Framework 3. Los nombres de tablas y columnas están en inglés; las descripciones están en español.

La tabla `shipments` es el **núcleo del modelo de datos**. Todos los demás módulos se relacionan con ella directa o indirectamente.

---

## 1. Tablas Django built-in

El módulo `django.contrib.auth` provee las siguientes tablas de forma automática:

| Tabla Django | Uso en este proyecto |
|---|---|
| `auth_user` | Cuenta de usuario base para toda persona que accede al sistema. La tabla `drivers` la extiende con una relación 1:1 para agregar campos específicos de logística (licencia, estado, teléfono). |
| `auth_group` | Grupos de permisos. Disponible para control de acceso basado en roles (ej. despachador, administrador de almacén). |
| `auth_permission` | Permisos granulares por objeto, vinculados a `auth_group` y `auth_user`. |
| `django_content_type` | Requerido por el sistema de permisos y el admin de Django. |
| `django_session` | Almacenamiento de sesiones del lado del servidor. |
| `django_admin_log` | Registro de auditoría de acciones realizadas desde el panel de administración. |

**Punto clave:** `drivers.user_id` es un `OneToOneField` hacia `auth_user.id`. Cada conductor debe tener primero una cuenta de usuario, y cada usuario puede ser conductor como máximo una vez.

---

## 2. Tablas custom

### 2.1 `warehouses_warehouse`

Punto de partida para los envíos y lugar de almacenamiento de productos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, auto-increment | Identificador único del almacén |
| `name` | VARCHAR(200) | NOT NULL | Nombre del almacén |
| `address` | VARCHAR(500) | NOT NULL | Dirección física del almacén |
| `city` | VARCHAR(100) | NOT NULL | Ciudad donde se encuentra el almacén |
| `country` | VARCHAR(100) | NOT NULL | País donde se encuentra el almacén |
| `latitude` | DECIMAL(9,6) | NULL | Latitud geográfica del almacén |
| `longitude` | DECIMAL(9,6) | NULL | Longitud geográfica del almacén |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Indica si el almacén está operativo |
| `created_at` | TIMESTAMPTZ | NOT NULL, auto | Fecha y hora de creación del registro |
| `updated_at` | TIMESTAMPTZ | NOT NULL, auto-update | Fecha y hora de última modificación |

**App Django:** `warehouses` · **Modelo:** `Warehouse`

---

### 2.2 `suppliers_supplier`

Empresas externas que proveen los productos tecnológicos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, auto-increment | Identificador único del proveedor |
| `name` | VARCHAR(200) | NOT NULL | Razón social o nombre comercial del proveedor |
| `contact_name` | VARCHAR(200) | NOT NULL | Nombre de la persona de contacto principal |
| `email` | VARCHAR(254) | NOT NULL, UNIQUE | Correo electrónico de contacto |
| `phone` | VARCHAR(30) | NOT NULL | Teléfono de contacto del proveedor |
| `address` | VARCHAR(500) | NOT NULL | Dirección física del proveedor |
| `city` | VARCHAR(100) | NOT NULL | Ciudad del proveedor |
| `country` | VARCHAR(100) | NOT NULL | País del proveedor |
| `created_at` | TIMESTAMPTZ | NOT NULL, auto | Fecha y hora de creación del registro |
| `updated_at` | TIMESTAMPTZ | NOT NULL, auto-update | Fecha y hora de última modificación |

**App Django:** `suppliers` · **Modelo:** `Supplier`

---

### 2.3 `customers_customer`

Persona natural o empresa que genera envíos en el sistema.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, auto-increment | Identificador único del cliente |
| `name` | VARCHAR(200) | NOT NULL | Nombre completo o razón social del cliente |
| `customer_type` | VARCHAR(10) | NOT NULL, choices: individual/company | Tipo de cliente: persona natural o empresa |
| `email` | VARCHAR(254) | NOT NULL, UNIQUE | Correo electrónico del cliente |
| `phone` | VARCHAR(30) | NOT NULL | Teléfono de contacto del cliente |
| `address` | VARCHAR(500) | NOT NULL | Dirección del cliente |
| `city` | VARCHAR(100) | NOT NULL | Ciudad del cliente |
| `country` | VARCHAR(100) | NOT NULL | País del cliente |
| `tax_id` | VARCHAR(50) | NULL, UNIQUE | NIT, RUT o número de identificación tributaria |
| `created_at` | TIMESTAMPTZ | NOT NULL, auto | Fecha y hora de creación del registro |
| `updated_at` | TIMESTAMPTZ | NOT NULL, auto-update | Fecha y hora de última modificación |

**App Django:** `customers` · **Modelo:** `Customer`

> `customer_type` se implementa como `CharField` con `choices` en Django. La BD almacena el valor crudo (`individual` o `company`); la etiqueta legible existe solo en la capa Python.

---

### 2.4 `products_product`

Artículos tecnológicos que pueden incluirse en un envío.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, auto-increment | Identificador único del producto |
| `name` | VARCHAR(200) | NOT NULL | Nombre del producto |
| `description` | TEXT | NULL | Descripción detallada del producto |
| `sku` | VARCHAR(100) | NOT NULL, UNIQUE | Código único de referencia (Stock Keeping Unit) |
| `weight_kg` | DECIMAL(8,3) | NOT NULL | Peso del producto en kilogramos |
| `width_cm` | DECIMAL(8,2) | NOT NULL | Ancho del producto en centímetros |
| `height_cm` | DECIMAL(8,2) | NOT NULL | Alto del producto en centímetros |
| `depth_cm` | DECIMAL(8,2) | NOT NULL | Profundidad del producto en centímetros |
| `unit_price` | DECIMAL(12,2) | NOT NULL | Precio unitario de venta del producto |
| `stock_quantity` | INTEGER | NOT NULL, DEFAULT 0 | Cantidad disponible en inventario |
| `supplier_id` | INTEGER | FK → suppliers_supplier.id, NOT NULL | Proveedor que suministra este producto |
| `warehouse_id` | INTEGER | FK → warehouses_warehouse.id, NOT NULL | Almacén donde se encuentra almacenado |
| `created_at` | TIMESTAMPTZ | NOT NULL, auto | Fecha y hora de creación del registro |
| `updated_at` | TIMESTAMPTZ | NOT NULL, auto-update | Fecha y hora de última modificación |

**App Django:** `products` · **Modelo:** `Product`

> Las dimensiones se almacenan en tres columnas separadas (no JSON) para permitir consultas e índices individuales por dimensión.

---

### 2.5 `drivers_driver`

Conductores del servicio de entrega. Cada conductor tiene exactamente una cuenta de usuario Django.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, auto-increment | Identificador único del conductor |
| `user_id` | INTEGER | FK → auth_user.id, NOT NULL, UNIQUE | Cuenta de usuario Django asociada (relación 1:1) |
| `license_number` | VARCHAR(50) | NOT NULL, UNIQUE | Número único de licencia de conducción |
| `license_expiry` | DATE | NOT NULL | Fecha de vencimiento de la licencia |
| `phone` | VARCHAR(30) | NOT NULL | Teléfono de contacto del conductor |
| `status` | VARCHAR(10) | NOT NULL, DEFAULT available, choices: available/busy/off_duty | Estado operativo actual del conductor |
| `created_at` | TIMESTAMPTZ | NOT NULL, auto | Fecha y hora de creación del registro |
| `updated_at` | TIMESTAMPTZ | NOT NULL, auto-update | Fecha y hora de última modificación |

**App Django:** `drivers` · **Modelo:** `Driver`

> Nombre, correo y contraseña del conductor se acceden via `driver.user.first_name`, `driver.user.email`, etc.

---

### 2.6 `transport_transport`

Vehículos disponibles para realizar entregas.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, auto-increment | Identificador único del vehículo |
| `name` | VARCHAR(200) | NOT NULL | Nombre o alias del vehículo |
| `type` | VARCHAR(15) | NOT NULL, choices: truck/van/motorcycle/bicycle | Tipo de vehículo |
| `plate_number` | VARCHAR(20) | NOT NULL, UNIQUE | Número de placa del vehículo |
| `capacity_kg` | DECIMAL(8,2) | NOT NULL | Capacidad máxima de carga en kilogramos |
| `capacity_m3` | DECIMAL(8,3) | NOT NULL | Capacidad máxima de carga en metros cúbicos |
| `driver_id` | INTEGER | FK → drivers_driver.id, NULL | Conductor actualmente asignado al vehículo |
| `status` | VARCHAR(15) | NOT NULL, DEFAULT available, choices: available/in_transit/maintenance | Estado operativo actual del vehículo |
| `created_at` | TIMESTAMPTZ | NOT NULL, auto | Fecha y hora de creación del registro |
| `updated_at` | TIMESTAMPTZ | NOT NULL, auto-update | Fecha y hora de última modificación |

**App Django:** `transport` · **Modelo:** `Transport`

> `driver_id` es nullable porque un vehículo puede existir sin conductor asignado (ej. en mantenimiento o en pool de disponibles).

---

### 2.7 `routes_route`

Rutas de entrega definidas, cada una compuesta por paradas ordenadas.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, auto-increment | Identificador único de la ruta |
| `name` | VARCHAR(200) | NOT NULL | Nombre descriptivo de la ruta |
| `origin_warehouse_id` | INTEGER | FK → warehouses_warehouse.id, NOT NULL | Almacén de origen desde donde parte la ruta |
| `status` | VARCHAR(10) | NOT NULL, DEFAULT active, choices: active/inactive | Estado de la ruta |
| `created_at` | TIMESTAMPTZ | NOT NULL, auto | Fecha y hora de creación del registro |
| `updated_at` | TIMESTAMPTZ | NOT NULL, auto-update | Fecha y hora de última modificación |

**App Django:** `routes` · **Modelo:** `Route`

---

### 2.8 `routes_routestop`

Paradas individuales que componen una ruta, ordenadas secuencialmente.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, auto-increment | Identificador único de la parada |
| `route_id` | INTEGER | FK → routes_route.id, NOT NULL | Ruta a la que pertenece esta parada |
| `stop_order` | INTEGER | NOT NULL | Número de orden de la parada dentro de la ruta (1, 2, 3…) |
| `address` | VARCHAR(500) | NOT NULL | Dirección exacta de la parada |
| `city` | VARCHAR(100) | NOT NULL | Ciudad de la parada |
| `latitude` | DECIMAL(9,6) | NULL | Latitud geográfica de la parada |
| `longitude` | DECIMAL(9,6) | NULL | Longitud geográfica de la parada |
| `created_at` | TIMESTAMPTZ | NOT NULL, auto | Fecha y hora de creación del registro |

**App Django:** `routes` · **Modelo:** `RouteStop`

> Restricción `unique_together`: `(route_id, stop_order)` — no pueden existir dos paradas con el mismo número de orden dentro de la misma ruta.

---

### 2.9 `shipments_shipment` — NÚCLEO DEL NEGOCIO

Entidad central del sistema. Representa un envío desde un almacén de origen hasta un destino, con toda la información de estado, costo, transporte asignado y ruta.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, auto-increment | Identificador único del envío |
| `tracking_number` | VARCHAR(50) | NOT NULL, UNIQUE | Código de rastreo único del envío |
| `customer_id` | INTEGER | FK → customers_customer.id, NOT NULL | Cliente que generó el envío |
| `origin_warehouse_id` | INTEGER | FK → warehouses_warehouse.id, NOT NULL | Almacén desde donde se origina el envío |
| `destination_address` | VARCHAR(500) | NOT NULL | Dirección completa de destino del envío |
| `destination_city` | VARCHAR(100) | NOT NULL | Ciudad de destino del envío |
| `destination_country` | VARCHAR(100) | NOT NULL | País de destino del envío |
| `status` | VARCHAR(15) | NOT NULL, DEFAULT pending, choices: pending/picked_up/in_transit/delivered/cancelled | Estado actual del envío en su ciclo de vida |
| `transport_id` | INTEGER | FK → transport_transport.id, NULL | Vehículo asignado (se asigna post-creación) |
| `route_id` | INTEGER | FK → routes_route.id, NULL | Ruta asignada (se asigna post-creación) |
| `scheduled_delivery_date` | DATE | NOT NULL | Fecha programada de entrega al cliente |
| `actual_delivery_date` | DATE | NULL | Fecha real en que se completó la entrega |
| `weight_kg` | DECIMAL(8,3) | NOT NULL | Peso total del envío en kilogramos |
| `base_cost` | DECIMAL(12,2) | NOT NULL | Costo base del envío antes de cálculos adicionales |
| `calculated_cost` | DECIMAL(12,2) | NULL | Costo final calculado (incluye variables de distancia, peso, etc.) |
| `notes` | TEXT | NULL | Notas o instrucciones especiales para el envío |
| `created_at` | TIMESTAMPTZ | NOT NULL, auto | Fecha y hora de creación del registro |
| `updated_at` | TIMESTAMPTZ | NOT NULL, auto-update | Fecha y hora de última modificación |

**App Django:** `shipments` · **Modelo:** `Shipment`

> `transport_id` y `route_id` son nullable porque el envío se crea primero en estado `pending` y el vehículo/ruta se asignan cuando pasa a `picked_up` o `in_transit`.
>
> El destino está desnormalizado (columnas planas) para evitar JOINs adicionales en la consulta más frecuente y porque la dirección de entrega es un dato puntual, no una referencia compartida reutilizable.

---

### 2.10 `shipments_shipmentproduct` — Tabla intermedia (M:N)

Registra qué productos van en cada envío y a qué precio estaban al momento de crearlo.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | INTEGER | PK, auto-increment | Identificador único del detalle de envío |
| `shipment_id` | INTEGER | FK → shipments_shipment.id, NOT NULL | Envío al que pertenece este detalle |
| `product_id` | INTEGER | FK → products_product.id, NOT NULL | Producto incluido en el envío |
| `quantity` | INTEGER | NOT NULL, CHECK > 0 | Cantidad de unidades del producto en este envío |
| `unit_price_at_shipment` | DECIMAL(12,2) | NOT NULL | Precio unitario del producto al momento de crear el envío (snapshot) |
| `created_at` | TIMESTAMPTZ | NOT NULL, auto | Fecha y hora de creación del registro |

**App Django:** `shipments` · **Modelo:** `ShipmentProduct`

> Restricción `unique_together`: `(shipment_id, product_id)` — un producto no puede aparecer más de una vez en el mismo envío.
>
> `unit_price_at_shipment` es un snapshot de `products_product.unit_price` al momento de crear el envío. Garantiza la integridad de facturación aunque el precio del producto cambie después.

---

## 3. Relaciones

### 3.1 Tabla de relaciones

| De | Tipo | A | `on_delete` | Nota |
|---|---|---|---|---|
| `auth_user` | 1:1 | `drivers` | CASCADE | Driver profile no tiene sentido sin usuario |
| `drivers` | 1:N | `transport` | SET_NULL (driver_id nullable) | Vehículo puede existir sin conductor asignado |
| `suppliers` | 1:N | `products` | PROTECT | No borrar proveedor con productos activos |
| `warehouses` | 1:N | `products` | PROTECT | No borrar almacén con productos activos |
| `warehouses` | 1:N | `routes` | PROTECT | Origen de la ruta |
| `warehouses` | 1:N | `shipments` | PROTECT | Origen del envío |
| `customers` | 1:N | `shipments` | PROTECT | Cliente generador del envío |
| `transport` | 1:N | `shipments` | SET_NULL (transport_id nullable) | Envío no se borra si se elimina un vehículo |
| `routes` | 1:N | `shipments` | SET_NULL (route_id nullable) | Envío no se borra si se elimina una ruta |
| `routes` | 1:N | `route_stops` | CASCADE | Paradas son hijos de la ruta |
| `shipments` | M:N | `products` | PROTECT (ambos FK) | Via `shipment_products`; no borrar si hay líneas activas |

### 3.2 Diagrama de relaciones

```
auth_user (Django built-in)
    |
    | 1:1
    v
drivers ──────────────────────────────────────────────────┐
                                                           |
                                                       1:N (nullable)
                                                           |
suppliers ──1:N──> products                           transport
    |                  |                                   |
    |              M:N via                             1:N (nullable)
    |          shipment_products                           |
warehouses ────────────┤                                   |
    |                  |                                   |
    | 1:N (origin)     v                                   |
    |─────────────> shipments <────────────────────────────┘
    |                  ^  ^
    | 1:N (origin)     |  |
    v                  |  └────── 1:N (nullable) ── routes ──1:N──> route_stops
  routes               |
                       └──────── 1:N ── customers
```

### 3.3 `shipments` como hub central

Recuperar un envío completo requiere JOINs de máximo 3 niveles:

```
shipments
  → customers
  → warehouses (origin)
  → transport → drivers → auth_user
  → routes → route_stops
  → shipment_products → products → suppliers
                                 → warehouses (storage)
```

---

## 4. Mapa app → tabla

| App Django | Modelo(s) | Tabla(s) en BD |
|---|---|---|
| `django.contrib.auth` | `User` | `auth_user` |
| `warehouses` | `Warehouse` | `warehouses_warehouse` |
| `suppliers` | `Supplier` | `suppliers_supplier` |
| `customers` | `Customer` | `customers_customer` |
| `products` | `Product` | `products_product` |
| `drivers` | `Driver` | `drivers_driver` |
| `transport` | `Transport` | `transport_transport` |
| `routes` | `Route`, `RouteStop` | `routes_route`, `routes_routestop` |
| `shipments` | `Shipment`, `ShipmentProduct` | `shipments_shipment`, `shipments_shipmentproduct` |

---

## 5. Notas de implementación

### Timestamps
Todos los modelos usan `auto_now_add=True` para `created_at` y `auto_now=True` para `updated_at`. Django los gestiona automáticamente; no deben exponerse como campos editables en los serializers DRF.

### Campos de opciones (choices)
Los campos `status` y `type` usan `CharField` con `TextChoices` en Django:
```python
class StatusChoices(models.TextChoices):
    PENDING = 'pending', 'Pendiente'
    IN_TRANSIT = 'in_transit', 'En tránsito'
    DELIVERED = 'delivered', 'Entregado'
```

### Generación de `tracking_number`
No es auto-increment. Se genera en el método `save()` del modelo `Shipment` o en la capa de servicio DRF con un patrón como `SHIP-{YYYYMMDD}-{UUID4[:8].upper()}`.

### Campos monetarios
`DECIMAL(12,2)` cubre hasta $9,999,999,999.99 por transacción. En Python siempre usar objetos `Decimal`, nunca `float`. En SQLite (dev) mapea a `REAL`; en PostgreSQL (prod) mapea a `NUMERIC` con precisión exacta.

### Drivers: extensión via 1:1 (no AbstractUser)
Se usa el patrón "profile extension" con `OneToOneField` en lugar de extender `AbstractUser`. Esto es más seguro en un proyecto ya scaffoldeado porque no requiere configurar `AUTH_USER_MODEL` antes de la primera migración.
