# Spec: Suppliers App

## Modelo (`suppliers/models.py`)

- [ ] Crear clase `Supplier(models.Model)` con campos:
  - [ ] `name = models.CharField(max_length=200)`
  - [ ] `contact_name = models.CharField(max_length=200)`
  - [ ] `email = models.EmailField(max_length=254, unique=True)`
  - [ ] `phone = models.CharField(max_length=30)`
  - [ ] `address = models.CharField(max_length=500)`
  - [ ] `city = models.CharField(max_length=100)`
  - [ ] `country = models.CharField(max_length=100)`
  - [ ] `created_at = models.DateTimeField(auto_now_add=True)`
  - [ ] `updated_at = models.DateTimeField(auto_now=True)`
- [ ] `class Meta`: `ordering = ['-created_at']`, `verbose_name = 'Supplier'`, `verbose_name_plural = 'Suppliers'`
- [ ] `def __str__`: retornar `self.name`

## Migraciones

- [ ] `python manage.py makemigrations suppliers`
- [ ] `python manage.py migrate`

## Serializers (`suppliers/serializers.py`)

- [ ] `SupplierReadSerializer` — fields: `id`, `name`, `contact_name`, `email`, `phone`, `address`, `city`, `country`, `created_at`, `updated_at`; `id`/`created_at`/`updated_at` `read_only=True`
- [ ] `SupplierWriteSerializer` — fields: `name`, `contact_name`, `email`, `phone`, `address`, `city`, `country` (sin id, sin timestamps)
- [ ] `validate_email()` — unicidad: si email ya existe en otro registro, `ValidationError`

## Views (`suppliers/views.py`)

- [ ] `SupplierViewSet(viewsets.ModelViewSet)`
- [ ] `queryset = Supplier.objects.all()`
- [ ] `permission_classes = [IsAuthenticated]`
- [ ] `get_serializer_class()` → `SupplierReadSerializer` en `list`/`retrieve`, `SupplierWriteSerializer` en el resto
- [ ] `filterset_fields = ['city', 'country']`
- [ ] `search_fields = ['name', 'contact_name', 'email']`
- [ ] `ordering_fields = ['name', 'created_at']`
- [ ] Override `create()` → valida con WriteSerializer, llama service, retorna `SupplierReadSerializer` con 201
- [ ] Override `update()` → valida con WriteSerializer (partial-aware), llama service, retorna `SupplierReadSerializer` con 200
- [ ] Override `destroy()` → llama service, retorna 204

## Service (`suppliers/services.py`)

- [ ] `SupplierService` con métodos estáticos:
  - [ ] `create_supplier(data)` → `Supplier.objects.create(**data)` + retornar instancia
  - [ ] `update_supplier(instance, data)` → `setattr` por campo + `.save()` + retornar instancia
  - [ ] `delete_supplier(instance)` → captura `ProtectedError` (on_delete=PROTECT desde `products`) → raise `ValidationError`; si no: `.delete()`

## URLs

- [ ] `suppliers/urls.py`: `DefaultRouter` + `router.register(r'suppliers', SupplierViewSet, basename='supplier')`
- [ ] `config/urls.py`: agregar `path('api/', include('suppliers.urls'))`

## Admin (`suppliers/admin.py`)

- [ ] `SupplierAdmin(admin.ModelAdmin)`:
  - [ ] `list_display = ('id', 'name', 'contact_name', 'email', 'city', 'country', 'created_at')`
  - [ ] `list_filter = ('city', 'country')`
  - [ ] `search_fields = ('name', 'contact_name', 'email')`
  - [ ] `readonly_fields = ('id', 'created_at', 'updated_at')`
- [ ] Registrar con `@admin.register(Supplier)`

## Endpoints resultantes

| Método | URL | Acción |
|--------|-----|--------|
| GET | `/api/suppliers/` | Listar (paginado, filtrable) |
| POST | `/api/suppliers/` | Crear |
| GET | `/api/suppliers/{id}/` | Detalle |
| PUT | `/api/suppliers/{id}/` | Actualizar completo |
| PATCH | `/api/suppliers/{id}/` | Actualizar parcial |
| DELETE | `/api/suppliers/{id}/` | Eliminar |
