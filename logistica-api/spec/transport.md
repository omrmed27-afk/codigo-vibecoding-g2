# Spec: Transport App

## Nota previa

App `transport` debe crearse con `startapp`. Registrar en `INSTALLED_APPS`.

## Modelo (`transport/models.py`)

- [ ] Crear clase `Transport(models.Model)` con clases anidadas `TransportType` y `TransportStatus` (ambas `models.TextChoices`):
  - [ ] `TransportType`: `TRUCK = 'truck', 'Truck'` | `VAN = 'van', 'Van'` | `MOTORCYCLE = 'motorcycle', 'Motorcycle'` | `BICYCLE = 'bicycle', 'Bicycle'`
  - [ ] `TransportStatus`: `AVAILABLE = 'available', 'Available'` | `IN_TRANSIT = 'in_transit', 'In Transit'` | `MAINTENANCE = 'maintenance', 'Maintenance'`
- [ ] Campos:
  - [ ] `name = models.CharField(max_length=200)`
  - [ ] `type = models.CharField(max_length=15, choices=TransportType.choices)`
  - [ ] `plate_number = models.CharField(max_length=20, unique=True)`
  - [ ] `capacity_kg = models.DecimalField(max_digits=8, decimal_places=2)`
  - [ ] `capacity_m3 = models.DecimalField(max_digits=8, decimal_places=3)`
  - [ ] `driver = models.ForeignKey('drivers.Driver', on_delete=models.SET_NULL, null=True, blank=True)`
  - [ ] `status = models.CharField(max_length=15, choices=TransportStatus.choices, default=TransportStatus.AVAILABLE)`
  - [ ] `created_at = models.DateTimeField(auto_now_add=True)`
  - [ ] `updated_at = models.DateTimeField(auto_now=True)`
- [ ] `class Meta`: `ordering = ['-created_at']`, `verbose_name = 'Transport'`, `verbose_name_plural = 'Transports'`
- [ ] `def __str__`: retornar `f"{self.name} ({self.plate_number})"`

## Migraciones

- [ ] `python manage.py makemigrations transport`
- [ ] `python manage.py migrate`

## Serializers (`transport/serializers.py`)

- [ ] `DriverSummarySerializer` — fields: `id`, `license_number`, `phone`, `status` (todos read_only, solo para anidar en lectura)
- [ ] `TransportReadSerializer` — fields: `id`, `name`, `type`, `plate_number`, `capacity_kg`, `capacity_m3`, `driver` (anidado con `DriverSummarySerializer`, read_only, allow_null=True), `status`, `created_at`, `updated_at`; `id`/`created_at`/`updated_at` `read_only=True`
- [ ] `TransportWriteSerializer` — fields: `name`, `type`, `plate_number`, `capacity_kg`, `capacity_m3`, `driver` (`PrimaryKeyRelatedField`, queryset=Driver.objects.all(), allow_null=True, required=False), `status`
- [ ] `validate_plate_number()` — unicidad excluyendo instancia actual si `self.instance`

## Views (`transport/views.py`)

- [ ] `TransportViewSet(viewsets.ModelViewSet)`
- [ ] `get_queryset()` → `Transport.objects.select_related('driver').all()` — N+1 cero
- [ ] `permission_classes = [IsAuthenticated]`
- [ ] `get_serializer_class()` → `TransportReadSerializer` en `list`/`retrieve`, `TransportWriteSerializer` en el resto
- [ ] `filterset_fields = ['status', 'type', 'driver']`
- [ ] `search_fields = ['name', 'plate_number']`
- [ ] `ordering_fields = ['name', 'created_at', 'status']`
- [ ] Override `create()` → WriteSerializer → service → `TransportReadSerializer` 201
- [ ] Override `update()` → WriteSerializer (partial-aware) → service → `TransportReadSerializer` 200
- [ ] Override `destroy()` → service → 204
- [ ] `@action(detail=True, methods=['post'], url_path='assign-driver')`:
  - [ ] Leer `driver_id` del request.data
  - [ ] Validar que `driver_id` exista → `get_object_or_404(Driver, pk=driver_id)`
  - [ ] Llamar `TransportService.assign_driver(instance, driver)`
  - [ ] Retornar `TransportReadSerializer` 200
- [ ] `@action(detail=True, methods=['post'], url_path='unassign-driver')`:
  - [ ] Sin body
  - [ ] Llamar `TransportService.unassign_driver(instance)`
  - [ ] Retornar `TransportReadSerializer` 200

## Service (`transport/services.py`)

- [ ] `TransportService` con métodos estáticos:
  - [ ] `create_transport(data)` → `Transport.objects.create(**data)` + retornar instancia con `select_related('driver')`
  - [ ] `update_transport(instance, data)` → `setattr` por campo + `.save()` + retornar instancia con `select_related('driver').get(pk=instance.pk)`
  - [ ] `delete_transport(instance)` → `.delete()` directo (FK desde shipments usa SET_NULL, sin riesgo de ProtectedError)
  - [ ] `assign_driver(instance, driver)` → `instance.driver = driver; instance.save()` + retornar con `select_related('driver').get(pk=instance.pk)`
  - [ ] `unassign_driver(instance)` → `instance.driver = None; instance.save()` + retornar con `select_related('driver').get(pk=instance.pk)`

## URLs

- [ ] `transport/urls.py`: `DefaultRouter` + `router.register(r'transport', TransportViewSet, basename='transport')`
- [ ] `config/urls.py`: agregar `path('api/', include('transport.urls'))`

## Admin (`transport/admin.py`)

- [ ] `TransportAdmin(admin.ModelAdmin)`:
  - [ ] `list_display = ('id', 'name', 'type', 'plate_number', 'driver', 'status', 'created_at')`
  - [ ] `list_filter = ('status', 'type')`
  - [ ] `search_fields = ('name', 'plate_number')`
  - [ ] `readonly_fields = ('id', 'created_at', 'updated_at')`
- [ ] Registrar con `@admin.register(Transport)`

## Endpoints resultantes

| Método | URL | Acción |
|--------|-----|--------|
| GET | `/api/transport/` | Listar (paginado, filtrable) |
| POST | `/api/transport/` | Crear |
| GET | `/api/transport/{id}/` | Detalle |
| PUT | `/api/transport/{id}/` | Actualizar completo |
| PATCH | `/api/transport/{id}/` | Actualizar parcial |
| DELETE | `/api/transport/{id}/` | Eliminar |
| POST | `/api/transport/{id}/assign-driver/` | Asignar conductor al vehículo |
| POST | `/api/transport/{id}/unassign-driver/` | Desasignar conductor del vehículo |
