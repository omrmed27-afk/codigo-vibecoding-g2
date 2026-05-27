# Spec: Routes App

## Nota previa

App `routes` debe crearse con `startapp`. Registrar en `INSTALLED_APPS`.

## Modelos (`routes/models.py`)

### `Route`

- [ ] Crear clase `Route(models.Model)` con clase anidada `RouteStatus(models.TextChoices)`:
  - [ ] `ACTIVE = 'active', 'Active'`
  - [ ] `INACTIVE = 'inactive', 'Inactive'`
- [ ] Campos:
  - [ ] `name = models.CharField(max_length=200)`
  - [ ] `origin_warehouse = models.ForeignKey('warehouses.Warehouse', on_delete=models.PROTECT)`
  - [ ] `status = models.CharField(max_length=10, choices=RouteStatus.choices, default=RouteStatus.ACTIVE)`
  - [ ] `created_at = models.DateTimeField(auto_now_add=True)`
  - [ ] `updated_at = models.DateTimeField(auto_now=True)`
- [ ] `class Meta`: `ordering = ['-created_at']`, `verbose_name = 'Route'`, `verbose_name_plural = 'Routes'`
- [ ] `def __str__`: retornar `self.name`

### `RouteStop`

- [ ] Crear clase `RouteStop(models.Model)` con campos:
  - [ ] `route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stops')`
  - [ ] `stop_order = models.IntegerField()`
  - [ ] `address = models.CharField(max_length=500)`
  - [ ] `city = models.CharField(max_length=100)`
  - [ ] `latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)`
  - [ ] `longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)`
  - [ ] `created_at = models.DateTimeField(auto_now_add=True)`
- [ ] `class Meta`: `unique_together = [('route', 'stop_order')]`, `ordering = ['stop_order']`, `verbose_name = 'Route Stop'`, `verbose_name_plural = 'Route Stops'`
- [ ] `def __str__`: retornar `f"Stop {self.stop_order} — {self.city}"`

## Migraciones

- [ ] `python manage.py makemigrations routes`
- [ ] `python manage.py migrate`

## Serializers (`routes/serializers.py`)

- [ ] `WarehouseSummarySerializer` — fields: `id`, `name` (ambos read_only, solo para anidar)
- [ ] `RouteStopSerializer` — fields: `id`, `stop_order`, `address`, `city`, `latitude`, `longitude`, `created_at`; `id`/`created_at` `read_only=True`
- [ ] `RouteStopWriteSerializer` — fields: `stop_order`, `address`, `city`, `latitude`, `longitude` (sin id, sin created_at, sin route)
- [ ] `RouteReadSerializer` — fields: `id`, `name`, `origin_warehouse` (anidado con `WarehouseSummarySerializer`, read_only), `status`, `stops` (`RouteStopSerializer`, many=True, read_only), `created_at`, `updated_at`; `id`/`created_at`/`updated_at` `read_only=True`
- [ ] `RouteWriteSerializer` — fields: `name`, `origin_warehouse` (`PrimaryKeyRelatedField`, queryset=Warehouse.objects.all()), `status`, `stops` (`RouteStopWriteSerializer`, many=True, required=False, default=list)

## Views (`routes/views.py`)

- [ ] `RouteViewSet(viewsets.ModelViewSet)`
- [ ] `get_queryset()` → `Route.objects.select_related('origin_warehouse').prefetch_related('stops').all()`
- [ ] `permission_classes = [IsAuthenticated]`
- [ ] `get_serializer_class()` → `RouteReadSerializer` en `list`/`retrieve`, `RouteWriteSerializer` en el resto
- [ ] `filterset_fields = ['status', 'origin_warehouse']`
- [ ] `search_fields = ['name']`
- [ ] `ordering_fields = ['name', 'created_at']`
- [ ] Override `create()` → WriteSerializer → service → `RouteReadSerializer` 201
- [ ] Override `update()` → WriteSerializer (partial-aware) → service → `RouteReadSerializer` 200
- [ ] Override `destroy()` → service → 204
- [ ] `@action(detail=True, methods=['get', 'post'], url_path='stops')`:
  - [ ] GET → `RouteService.list_stops(instance)` → `RouteStopSerializer(many=True)` 200
  - [ ] POST → `RouteStopWriteSerializer(data=request.data)` → `RouteService.add_stop(instance, validated_data)` → `RouteStopSerializer` 201
- [ ] `@action(detail=True, methods=['delete'], url_path='stops/(?P<stop_pk>[^/.]+)')`:
  - [ ] DELETE → `RouteService.delete_stop(instance, stop_pk)` → 204

## Service (`routes/services.py`)

- [ ] `RouteService` con métodos estáticos:
  - [ ] `create_route(data)` → `transaction.atomic()`: extraer `stops = data.pop('stops', [])`, `Route.objects.create(**data)`, luego crear cada stop con `RouteStop.objects.create(route=route, **stop_data)`; retornar con `select_related('origin_warehouse').prefetch_related('stops')`
  - [ ] `update_route(instance, data)` → `transaction.atomic()`: extraer stops si presente, actualizar Route con setattr + save; si stops presente: `instance.stops.all().delete()` + recrear; retornar con `select_related/prefetch_related`
  - [ ] `delete_route(instance)` → `.delete()` directo (shipments FK usa SET_NULL, sin ProtectedError)
  - [ ] `add_stop(route, data)` → `RouteStop.objects.create(route=route, **data)`; si IntegrityError (unique_together): raise `ValidationError('A stop with this order already exists for this route.')`
  - [ ] `delete_stop(route, stop_pk)` → `get_object_or_404(RouteStop, pk=stop_pk, route=route)` + `.delete()`
  - [ ] `list_stops(route)` → `route.stops.all()`

## URLs

- [ ] `routes/urls.py`: `DefaultRouter` + `router.register(r'routes', RouteViewSet, basename='route')`
- [ ] `config/urls.py`: agregar `path('api/', include('routes.urls'))`

## Admin (`routes/admin.py`)

- [ ] `RouteAdmin(admin.ModelAdmin)`:
  - [ ] `list_display = ('id', 'name', 'origin_warehouse', 'status', 'created_at')`
  - [ ] `list_filter = ('status',)`
  - [ ] `search_fields = ('name',)`
  - [ ] `readonly_fields = ('id', 'created_at', 'updated_at')`
- [ ] `RouteStopAdmin(admin.ModelAdmin)`:
  - [ ] `list_display = ('id', 'route', 'stop_order', 'city', 'address')`
  - [ ] `list_filter = ('route',)`
  - [ ] `readonly_fields = ('id', 'created_at')`
- [ ] Registrar ambos con `@admin.register`

## Endpoints resultantes

| Método | URL | Acción |
|--------|-----|--------|
| GET | `/api/routes/` | Listar rutas (paginado, filtrable) |
| POST | `/api/routes/` | Crear ruta (con stops opcional) |
| GET | `/api/routes/{id}/` | Detalle con stops anidados |
| PUT | `/api/routes/{id}/` | Actualizar completo (reemplaza stops si se envían) |
| PATCH | `/api/routes/{id}/` | Actualizar parcial |
| DELETE | `/api/routes/{id}/` | Eliminar ruta y sus stops (CASCADE) |
| GET | `/api/routes/{id}/stops/` | Listar stops de ruta |
| POST | `/api/routes/{id}/stops/` | Añadir stop a ruta existente |
| DELETE | `/api/routes/{id}/stops/{stop_pk}/` | Eliminar stop individual |
