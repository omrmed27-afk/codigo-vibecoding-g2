# Arquitectura de desarrollo — Logistics API MVP

## Referencia de schema

Toda decisión de modelos y relaciones sigue [`docs/database-schema.md`](database-schema.md).

---

## 1. Principios del MVP

- **Thin views, fat services**: los ViewSets solo orquestan; la lógica de negocio vive en `services.py`
- **Serializers como contrato de API**: validación en la capa de presentación, no en modelos
- **N+1 cero**: todo queryset que serialice relaciones usa `select_related` / `prefetch_related`
- **Errores consistentes**: un solo formato de respuesta de error en toda la API
- **Sin over-engineering**: no abstracciones que no tengan uso inmediato en el MVP

---

## 2. Estructura del proyecto

```
logistica-api/
├── config/
│   ├── settings/
│   │   ├── base.py          # settings compartidos
│   │   ├── development.py   # DEBUG=True, SQLite
│   │   └── production.py    # PostgreSQL, SECRET_KEY desde .env
│   ├── urls.py              # router raíz, incluye urls de cada app
│   ├── wsgi.py
│   └── asgi.py
│
├── core/                    # utilidades compartidas (no es una app Django)
│   ├── exceptions.py        # handler global de errores → formato JSON uniforme
│   ├── pagination.py        # paginación estándar del proyecto
│   └── permissions.py       # permisos DRF reutilizables
│
├── warehouses/              # ─┐
├── suppliers/               #  │
├── customers/               #  │  apps de catálogo (Fase 1)
├── products/                # ─┘
│
├── drivers/                 # ─┐
├── transport/               #  │  apps de operaciones (Fase 2)
├── routes/                  # ─┘
│
├── shipments/               # núcleo del negocio (Fase 3)
│
├── docs/
│   ├── database-schema.md
│   └── architecture.md
│
├── manage.py
├── requirements.txt
└── .env                     # nunca en git
```

### Estructura interna de cada app

```
<app>/
├── models.py        # solo definición de campos y Meta; sin lógica de negocio
├── serializers.py   # validación y serialización; separar read/write cuando difieren
├── views.py         # ViewSets delgados; llaman a services.py
├── services.py      # lógica de negocio; único lugar que escribe en BD
├── urls.py          # router local de la app
├── admin.py         # registro en el panel admin
└── migrations/
```

---

## 3. Capas y responsabilidades

```
Request → ViewSet → Serializer (validación) → Service (lógica) → Model (ORM) → BD
Response ← ViewSet ← Serializer (serialización) ←──────────────────────────────
```

| Capa | Archivo | Responsabilidad |
|---|---|---|
| **Presentación** | `views.py` | Recibir request, llamar serializer, llamar service, retornar response |
| **Validación** | `serializers.py` | Validar input, serializar output, no tocar BD directamente |
| **Negocio** | `services.py` | Reglas de negocio, cálculos, transiciones de estado, escrituras en BD |
| **Datos** | `models.py` | Definición de campos, Meta, `__str__`, propiedades simples |
| **Transversal** | `core/` | Excepciones, paginación, permisos compartidos |

---

## 4. Autenticación y permisos (MVP)

**Mecanismo:** JWT via `djangorestframework-simplejwt`. Access token + Refresh token. Stateless, sin tabla de sesiones.

**Instalar:**
```
djangorestframework-simplejwt
```

**Configuración en `settings/base.py`:**
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'core.pagination.StandardPagination',
    'PAGE_SIZE': 20,
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}
```

**Endpoints de auth en `config/urls.py`:**
```python
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register/', include('auth_app.urls')),  # vista custom
]
```

**Endpoints públicos del MVP:** solo `POST /api/auth/login/`, `POST /api/auth/refresh/`, y `POST /api/auth/register/`.

**Roles (via `auth_group`):**
| Grupo | Acceso |
|---|---|
| `admin` | CRUD completo en todos los módulos |
| `dispatcher` | CRUD en shipments, routes, transport; lectura en el resto |
| `driver` | Lectura de shipments asignados; update de status propio |

---

## 5. Fases de desarrollo del MVP

### Fase 1 — Catálogos base
Apps: `warehouses`, `suppliers`, `customers`, `products`

Estas apps no tienen dependencias entre sí (excepto `products` → `suppliers` y `warehouses`). Se implementan primero porque `shipments` las necesita.

Entregables por app:
- Modelo completo con campos del schema
- ModelViewSet con CRUD completo
- Serializer con validaciones básicas
- Registro en admin

### Fase 2 — Operaciones
Apps: `drivers`, `transport`, `routes`

`drivers` extiende `auth_user`. `transport` depende de `drivers`. `routes` depende de `warehouses`.

Entregables adicionales:
- `drivers`: endpoint para crear usuario + driver en una sola transacción (atomicidad via `transaction.atomic`)
- `routes`: serializer anidado para crear `route_stops` junto con la ruta
- `transport`: action personalizada para asignar/desasignar conductor

### Fase 3 — Núcleo (shipments)
App: `shipments`

Es la más compleja. Depende de todas las apps anteriores.

Entregables:
- `ShipmentService` con método `create_shipment(data)` que:
  1. Genera `tracking_number` automáticamente
  2. Calcula `base_cost` según peso
  3. Crea el `Shipment` y los `ShipmentProduct` en `transaction.atomic`
- Action `assign_transport(shipment_id, transport_id, route_id)` → transición a `picked_up`
- Action `mark_delivered(shipment_id)` → transición a `delivered`, setea `actual_delivery_date`
- Serializer de lectura con relaciones anidadas (`customer`, `transport`, `route`, `products`)
- Serializer de escritura con IDs de FK + lista de productos con cantidad

### Fase 4 — Autenticación
Habilitar login/register, proteger todos los endpoints, asignar grupos a usuarios.

---

## 6. Formato de respuesta API

**Éxito (lista):**
```json
{
  "count": 42,
  "next": "http://localhost:8000/shipments/?page=3",
  "previous": "http://localhost:8000/shipments/?page=1",
  "results": [...]
}
```

**Éxito (objeto):**
```json
{ "id": 1, "tracking_number": "SHIP-20260519-A3B4C5D6", ... }
```

**Error:**
```json
{
  "error": {
    "code": "validation_error",
    "message": "Datos inválidos",
    "details": { "weight_kg": ["Este campo es requerido."] }
  }
}
```

El `custom_exception_handler` en `core/exceptions.py` normaliza todas las respuestas de error de DRF a este formato.

---

## 7. Endpoints por módulo

| Módulo | Base URL | Acciones extra |
|---|---|---|
| Auth | `/api/auth/` | `login/`, `logout/`, `register/` |
| Warehouses | `/api/warehouses/` | — |
| Suppliers | `/api/suppliers/` | — |
| Customers | `/api/customers/` | — |
| Products | `/api/products/` | — |
| Drivers | `/api/drivers/` | — |
| Transport | `/api/transport/` | `{id}/assign-driver/`, `{id}/unassign-driver/` |
| Routes | `/api/routes/` | `{id}/stops/` (nested) |
| Shipments | `/api/shipments/` | `{id}/assign-transport/`, `{id}/mark-delivered/`, `{id}/cancel/` |

Todos los endpoints de lista soportan paginación. Filtros con `django-filter` (a agregar en `requirements.txt`).

---

## 8. Settings por entorno

`DJANGO_SETTINGS_MODULE` selecciona el archivo:

```
config/settings/base.py       → lógica compartida
config/settings/development.py → importa base; SQLite; DEBUG=True; ALLOWED_HOSTS=['*']
config/settings/production.py  → importa base; PostgreSQL desde .env; DEBUG=False
```

Variables sensibles siempre en `.env` via `python-decouple`:
```
SECRET_KEY=
DATABASE_URL=
DEBUG=
ALLOWED_HOSTS=
```

---

## 9. Dependencias a agregar

```
# requirements.txt — agregar al stack actual
django-filter==24.x              # filtros en list endpoints
djangorestframework-simplejwt    # JWT auth (access + refresh tokens)
```

`django-filter` se configura globalmente en `REST_FRAMEWORK['DEFAULT_FILTER_BACKENDS']`.

---

## 10. Lo que queda fuera del MVP

| Feature | Motivo |
|---|---|
| Cálculo de costo avanzado (distancia, zona) | Requiere integración externa (Google Maps, etc.) |
| Notificaciones (email, SMS) al cliente | Infraestructura extra |
| Tracking en tiempo real | WebSockets / Celery |
| Historial de cambios de estado de envíos | Tabla de auditoría adicional |
| Tests automatizados | Se agregan en iteración siguiente al MVP |
| API versioning (`/api/v1/`) | Agregar cuando exista una v2 real |
