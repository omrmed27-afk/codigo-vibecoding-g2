# Spec: Warehouses App

## Modelo (`warehouses/models.py`)

- [ ] Crear clase `Warehouse(models.Model)` con campos:
  - [ ] `name = models.CharField(max_length=200)`
  - [ ] `address = models.CharField(max_length=500)`
  - [ ] `city = models.CharField(max_length=100)`
  - [ ] `country = models.CharField(max_length=100)`
  - [ ] `latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)`
  - [ ] `longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)`
  - [ ] `is_active = models.BooleanField(default=True)`
  - [ ] `created_at = models.DateTimeField(auto_now_add=True)`
  - [ ] `updated_at = models.DateTimeField(auto_now=True)`
- [ ] `class Meta`: `ordering = ['-created_at']`, `verbose_name = 'Warehouse'`, `verbose_name_plural = 'Warehouses'`
- [ ] `def __str__`: retornar `self.name`

## Migraciones

- [ ] `python manage.py makemigrations warehouses`
- [ ] `python manage.py migrate`

## Serializers (`warehouses/serializers.py`)

- [ ] `WarehouseReadSerializer` — fields: `id`, `name`, `address`, `city`, `country`, `latitude`, `longitude`, `is_active`, `created_at`, `updated_at`; `created_at`/`updated_at` `read_only=True`
- [ ] `WarehouseWriteSerializer` — fields: `name`, `address`, `city`, `country`, `latitude`, `longitude`, `is_active` (sin `id`, sin timestamps)
- [ ] `validate_latitude()` — si no null, valor entre -90 y 90
- [ ] `validate_longitude()` — si no null, valor entre -180 y 180
- [ ] `validate()` nivel objeto — si lat presente, lon requerido y viceversa

## Views (`warehouses/views.py`)

- [ ] `WarehouseViewSet(viewsets.ModelViewSet)`
- [ ] `queryset = Warehouse.objects.all()`
- [ ] `permission_classes = [IsAuthenticated]`
- [ ] `get_serializer_class()` → `WarehouseReadSerializer` en `list`/`retrieve`, `WarehouseWriteSerializer` en el resto
- [ ] `filterset_fields = ['is_active', 'city', 'country']`
- [ ] `search_fields = ['name', 'address', 'city']`
- [ ] `ordering_fields = ['name', 'created_at']`
- [ ] `perform_create` → llama `WarehouseService.create_warehouse(serializer.validated_data)`
- [ ] `perform_update` → llama `WarehouseService.update_warehouse(self.get_object(), serializer.validated_data)`
- [ ] `perform_destroy` → llama `WarehouseService.delete_warehouse(instance)`

## Service (`warehouses/services.py`)

- [ ] `WarehouseService` con métodos estáticos:
  - [ ] `create_warehouse(data)` → `Warehouse(**data)` + `.save()` + retornar instancia
  - [ ] `update_warehouse(instance, data)` → `setattr` por campo + `.save()` + retornar instancia
  - [ ] `delete_warehouse(instance)` → verificar FKs dependientes (products, routes, shipments usan `on_delete=PROTECT`); si dependencias: raise `ValidationError`; si no: `.delete()`

## URLs

- [ ] `warehouses/urls.py`: `DefaultRouter` + `router.register(r'warehouses', WarehouseViewSet, basename='warehouse')`
- [ ] `config/urls.py`: agregar `path('api/', include('warehouses.urls'))`

## Admin (`warehouses/admin.py`)

- [ ] `WarehouseAdmin(admin.ModelAdmin)`:
  - [ ] `list_display = ('id', 'name', 'city', 'country', 'is_active', 'created_at')`
  - [ ] `list_filter = ('is_active', 'city', 'country')`
  - [ ] `search_fields = ('name', 'address', 'city')`
  - [ ] `readonly_fields = ('id', 'created_at', 'updated_at')`
- [ ] Registrar con `@admin.register(Warehouse)`

## Endpoints resultantes

| Método | URL | Acción |
|--------|-----|--------|
| GET | `/api/warehouses/` | Listar (paginado, filtrable, searchable) |
| POST | `/api/warehouses/` | Crear |
| GET | `/api/warehouses/{id}/` | Detalle |
| PUT | `/api/warehouses/{id}/` | Actualizar completo |
| PATCH | `/api/warehouses/{id}/` | Actualizar parcial |
| DELETE | `/api/warehouses/{id}/` | Eliminar |
