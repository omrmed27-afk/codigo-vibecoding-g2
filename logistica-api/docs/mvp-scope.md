# MVP Scope — Logistics API

## Alcance del MVP

CRUD completo para los 8 módulos:

| Fase | Módulos | Dependencias |
|------|---------|-------------|
| Fase 1 — Catálogos | `warehouses`, `suppliers`, `customers`, `products` | Ninguna entre sí (products → suppliers, warehouses) |
| Fase 2 — Operaciones | `drivers`, `transport`, `routes` | drivers → auth_user; transport → drivers; routes → warehouses |
| Fase 3 — Núcleo | `shipments` + `shipment_products` | Todas las apps anteriores |
| Fase 4 — Auth | JWT endpoints | Django auth_user + simplejwt |

### Acciones especiales incluidas en MVP

- `transport`: `{id}/assign-driver/`, `{id}/unassign-driver/`
- `routes`: gestión anidada de `route_stops` vía `{id}/stops/`
- `shipments`: `{id}/assign-transport/`, `{id}/mark-delivered/`, `{id}/cancel/`

---

## Autenticación

**Stack:** Django auth system (`auth_user`, `auth_group`, `auth_permission`) + JWT via `djangorestframework-simplejwt`.

- Endpoints públicos: `POST /api/auth/login/`, `POST /api/auth/register/`
- Todos los demás endpoints requieren `Authorization: Bearer <access_token>`
- Access token + Refresh token
- Roles via `auth_group`:

| Grupo | Acceso |
|-------|--------|
| `admin` | CRUD completo en todos los módulos |
| `dispatcher` | CRUD en shipments, routes, transport; lectura en el resto |
| `driver` | Lectura de shipments asignados; update de status propio |

---

## Deploy target

**Railway** — PostgreSQL en producción.

Settings separados:
- `config/settings/development.py` — SQLite, DEBUG=True
- `config/settings/production.py` — PostgreSQL via `DATABASE_URL`, DEBUG=False

Variables en `.env` via `python-decouple`:
```
SECRET_KEY=
DATABASE_URL=
DEBUG=
ALLOWED_HOSTS=
```

---

## Fuera del MVP

Ver `docs/architecture.md` sección 10.

---

## Metodología: SDD (Spec Driven Development)

Flujo obligatorio por módulo:

```
Spec → Implement → Validate
```

1. **Spec** — Agente `spec` crea `spec/<module>.md` con tareas atómicas exactas
2. **Implement** — Agente `implement` desarrolla el código siguiendo spec + architecture + schema
3. **Validate** — Agente `validator` revisa el código; genera `spec/validation/<module>-validation.md` con errores o confirma éxito

Un módulo no está completo hasta que el validador confirma sin errores.

### Agentes disponibles en `.claude/agents/`

| Agente | Rol | Escribe código |
|--------|-----|---------------|
| `orchestrator` | Coordina el flujo SDD, gestiona al equipo | No |
| `spec` | Genera `spec/<module>.md` por módulo | No (solo MD) |
| `implement` | Desarrolla código Django siguiendo spec | Sí |
| `validator` | Revisa código y reporta errores | No (solo MD) |
