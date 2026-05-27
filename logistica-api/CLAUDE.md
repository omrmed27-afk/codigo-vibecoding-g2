# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) al trabajar con código en este repositorio.

## Reglas de desarrollo

Antes de iniciar cualquier tarea de desarrollo (crear app, modelo, endpoint, serializer, servicio, migración, etc.), leer obligatoriamente:

1. **[`docs/architecture.md`](docs/architecture.md)** — estructura del proyecto, capas, fases del MVP, formato de respuesta, lo que queda fuera del MVP
2. **[`docs/database-schema.md`](docs/database-schema.md)** — tablas, columnas, tipos, restricciones y relaciones con `on_delete`

Estas dos fuentes son la referencia de verdad del proyecto. Cualquier decisión técnica debe ser consistente con ellas.

## Reglas de ejecución de comandos

- **Entorno virtual**: antes de ejecutar cualquier comando dentro del proyecto, siempre activar el entorno virtual: `.venv\Scripts\activate` (Windows)
- **`python manage.py runserver` está prohibido**: ese comando lo ejecuta el desarrollador manualmente. Todos los demás comandos (`migrate`, `makemigrations`, `test`, `startapp`, `pip install`, etc.) pueden ejecutarse con normalidad

## Reglas de idioma

- **Documentación y comunicación**: siempre en español (comentarios explicativos, respuestas, mensajes de error para el usuario, este archivo)
- **Todo lo técnico**: siempre en inglés (código, nombres de variables/funciones/clases, carpetas, tablas, columnas de BD, nombres de archivos, ramas de git, commits)

## Contexto del proyecto

API REST de logística para gestión de envíos de productos tecnológicos. Construida con Django REST Framework siguiendo buenas prácticas (serializers, viewsets, routers, permisos, validaciones en capa de servicio).

### Módulos

| App Django | Dominio | Responsabilidad |
|---|---|---|
| `customers` | Cliente | Empresa o persona que genera envíos |
| `shipments` | Envío | Unidad central de negocio: origen, destino, estado, fecha de entrega, costo calculado |
| `products` | Producto | Productos tecnológicos que serán enviados |
| `transport` | Transporte | Medio de entrega de productos al cliente |
| `drivers` | Conductor | Persona asignada al transporte |
| `routes` | Ruta | Secuencia de paradas del transporte |
| `warehouses` | Almacén | Punto de partida y almacenamiento de productos |
| `suppliers` | Proveedor | Empresas que venden los productos |

> El módulo `shipments` es el núcleo del negocio — la mayoría de relaciones convergen en él.

### Documentación técnica

| Documento | Cuándo leerlo |
|---|---|
| [`docs/database-schema.md`](docs/database-schema.md) | Antes de crear o modificar cualquier modelo. Fuente de verdad del schema: tablas, columnas, tipos, restricciones, relaciones y `on_delete`. |
| [`docs/architecture.md`](docs/architecture.md) | Antes de crear una nueva app o feature. Define estructura de carpetas, capas (views → services → models), fases del MVP, formato de respuesta API y lo que queda fuera del MVP. |

## Skills activos

- **django-skills** (plugin `saaspegasus/django-skills`) está instalado y debe usarse para todas las tareas Django: crear modelos, vistas, URLs, migraciones, serializers, configuración de DRF, etc. Invocar `/django` o los comandos del skill antes de implementar cualquier patrón Django manualmente.

## Stack

Python · Django 6 · Django REST Framework 3 · SQLite (dev) / PostgreSQL (prod via psycopg2) · python-decouple

## Comandos

```bash
# Activar el entorno virtual primero (Windows)
.venv\Scripts\activate

python manage.py runserver          # Servidor en http://localhost:8000
python manage.py makemigrations     # Generar migraciones tras cambios en modelos
python manage.py migrate            # Aplicar migraciones pendientes
python manage.py test               # Ejecutar suite de pruebas
python manage.py createsuperuser    # Crear usuario administrador
```

> `runserver` debe ejecutarse manualmente por el desarrollador. Nunca ejecutarlo de forma automática.

## Arquitectura

Módulo de configuración en `config/settings.py`. Raíz de URLs en `config/urls.py` — solo `/admin/` está conectado; los endpoints de cada app van aquí.

Cada dominio es una app Django (ej. `products/`). Estructura estándar por app:
- `models.py` → `views.py` (DRF ViewSets o APIViews) → registrar URLs en `config/urls.py`
- `migrations/` — generado automáticamente, siempre incluir en commits

Variables de entorno gestionadas con **python-decouple** (lee archivo `.env`). No existe `.env.example` aún — crear uno junto con `.env`.

## Estado actual

Proyecto scaffoldeado pero sin implementar:
- App `products` existe pero modelos, vistas y URLs están vacíos
- `products` **no está registrado** en `INSTALLED_APPS` en `config/settings.py`
- Sin configuración de `REST_FRAMEWORK` en settings
- Sin archivo `.env` (la `SECRET_KEY` está hardcodeada — moverla antes de cualquier despliegue)

## Agregar una nueva app / dominio

1. `python manage.py startapp <name>`
2. Agregar `'<name>'` a `INSTALLED_APPS` en `config/settings.py`
3. Definir modelos → `makemigrations` → `migrate`
4. Agregar vistas con DRF (`APIView` o `ViewSet` + `Router`)
5. Conectar URLs: `path('<name>/', include('<name>.urls'))` en `config/urls.py`

---

## Metodología de desarrollo: SDD (Spec Driven Development)

**Este proyecto usa SDD. Para cualquier tarea de desarrollo (nueva app, modelo, endpoint, feature), siempre seguir el flujo SDD coordinado por el agente orquestador.**

### Flujo obligatorio

```
Spec → Implement → Validate
```

1. Agente `spec` crea `spec/<module>.md` con tareas atómicas exactas
2. Agente `implement` desarrolla el código siguiendo el spec
3. Agente `validator` revisa y reporta — si hay errores, volver al paso 2

Un módulo no está completo hasta que el validador confirma sin errores.

### Agentes disponibles en `.claude/agents/`

| Agente | Archivo | Rol |
|--------|---------|-----|
| `orchestrator` | `.claude/agents/orchestrator.md` | Coordina el flujo SDD. No escribe código. **Punto de entrada para cualquier tarea de desarrollo.** |
| `spec` | `.claude/agents/spec.md` | Genera `spec/<module>.md` por módulo |
| `implement` | `.claude/agents/implement.md` | Desarrolla código Django siguiendo spec |
| `validator` | `.claude/agents/validator.md` | Revisa código y reporta errores |

> **Regla**: Iniciar siempre por el agente `orchestrator`. Ver también [`docs/mvp-scope.md`](docs/mvp-scope.md).
