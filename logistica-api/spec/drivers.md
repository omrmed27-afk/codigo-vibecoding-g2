# Spec: Drivers App

## Nota previa

App `drivers` debe crearse con `startapp`. Registrar en `INSTALLED_APPS`.

## Modelo (`drivers/models.py`)

- [ ] Crear clase `Driver(models.Model)` con clase anidada `DriverStatus(models.TextChoices)`:
  - [ ] `AVAILABLE = 'available', 'Available'`
  - [ ] `BUSY = 'busy', 'Busy'`
  - [ ] `OFF_DUTY = 'off_duty', 'Off Duty'`
- [ ] Campos:
  - [ ] `user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='driver_profile')`
  - [ ] `license_number = models.CharField(max_length=50, unique=True)`
  - [ ] `license_expiry = models.DateField()`
  - [ ] `phone = models.CharField(max_length=30)`
  - [ ] `status = models.CharField(max_length=10, choices=DriverStatus.choices, default=DriverStatus.AVAILABLE)`
  - [ ] `created_at = models.DateTimeField(auto_now_add=True)`
  - [ ] `updated_at = models.DateTimeField(auto_now=True)`
- [ ] `class Meta`: `ordering = ['-created_at']`, `verbose_name = 'Driver'`, `verbose_name_plural = 'Drivers'`
- [ ] `def __str__`: retornar `f"{self.user.get_full_name()} ({self.license_number})"`

## Migraciones

- [ ] `python manage.py makemigrations drivers`
- [ ] `python manage.py migrate`

## Serializers (`drivers/serializers.py`)

- [ ] `UserSummarySerializer` — fields: `id`, `username`, `email`, `first_name`, `last_name` (todos read_only)
- [ ] `DriverReadSerializer` — fields: `id`, `user` (anidado con UserSummarySerializer, read_only), `license_number`, `license_expiry`, `phone`, `status`, `created_at`, `updated_at`; `id`/`created_at`/`updated_at` `read_only=True`
- [ ] `DriverWriteSerializer` — fields planos: `username`, `password` (write_only, required), `email`, `first_name`, `last_name`, `license_number`, `license_expiry`, `phone`, `status`
- [ ] `validate_license_number()` — unicidad excluyendo instancia actual si `self.instance`

## Views (`drivers/views.py`)

- [ ] `DriverViewSet(viewsets.ModelViewSet)`
- [ ] `get_queryset()` → `Driver.objects.select_related('user').all()` — N+1 cero
- [ ] `permission_classes = [IsAuthenticated]`
- [ ] `get_serializer_class()` → `DriverReadSerializer` en `list`/`retrieve`, `DriverWriteSerializer` en el resto
- [ ] `filterset_fields = ['status']`
- [ ] `search_fields = ['user__username', 'user__email', 'license_number']`
- [ ] `ordering_fields = ['created_at', 'status']`
- [ ] Override `create()` → WriteSerializer → service → `DriverReadSerializer` 201
- [ ] Override `update()` → WriteSerializer (partial-aware) → service → `DriverReadSerializer` 200
- [ ] Override `destroy()` → service → 204

## Service (`drivers/services.py`)

- [ ] `DriverService` con métodos estáticos:
  - [ ] `create_driver_with_user(data)` → `transaction.atomic()`: extraer user fields (username, password, email, first_name, last_name), `User.objects.create_user(**user_data)`, luego `Driver.objects.create(user=user, **driver_data)`; retornar instancia con `select_related('user')`
  - [ ] `update_driver_with_user(instance, data)` → `transaction.atomic()`: separar user fields de driver fields, actualizar `instance.user` con setattr + `.save()`, actualizar driver con setattr + `.save()`; retornar instancia con `select_related('user').get(pk=instance.pk)`
  - [ ] `delete_driver(instance)` → `instance.user.delete()` (CASCADE elimina el driver automáticamente)

## URLs

- [ ] `drivers/urls.py`: `DefaultRouter` + `router.register(r'drivers', DriverViewSet, basename='driver')`
- [ ] `config/urls.py`: agregar `path('api/', include('drivers.urls'))`

## Admin (`drivers/admin.py`)

- [ ] `DriverAdmin(admin.ModelAdmin)`:
  - [ ] `list_display = ('id', 'user', 'license_number', 'status', 'phone', 'created_at')`
  - [ ] `list_filter = ('status',)`
  - [ ] `search_fields = ('user__username', 'user__email', 'license_number')`
  - [ ] `readonly_fields = ('id', 'created_at', 'updated_at')`
- [ ] Registrar con `@admin.register(Driver)`

## Endpoints resultantes

| Método | URL | Acción |
|--------|-----|--------|
| GET | `/api/drivers/` | Listar (paginado, filtrable) |
| POST | `/api/drivers/` | Crear conductor + usuario |
| GET | `/api/drivers/{id}/` | Detalle |
| PUT | `/api/drivers/{id}/` | Actualizar completo |
| PATCH | `/api/drivers/{id}/` | Actualizar parcial |
| DELETE | `/api/drivers/{id}/` | Eliminar conductor + usuario |
