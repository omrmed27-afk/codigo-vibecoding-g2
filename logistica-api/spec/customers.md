# Spec: Customers App

## Modelo (`customers/models.py`)

- [ ] `CustomerType(models.TextChoices)` anidado en la clase:
  - [ ] `INDIVIDUAL = 'individual', 'Individual'`
  - [ ] `COMPANY = 'company', 'Company'`
- [ ] Crear clase `Customer(models.Model)` con campos:
  - [ ] `name = models.CharField(max_length=200)`
  - [ ] `customer_type = models.CharField(max_length=10, choices=CustomerType.choices)`
  - [ ] `email = models.EmailField(max_length=254, unique=True)`
  - [ ] `phone = models.CharField(max_length=30)`
  - [ ] `address = models.CharField(max_length=500)`
  - [ ] `city = models.CharField(max_length=100)`
  - [ ] `country = models.CharField(max_length=100)`
  - [ ] `tax_id = models.CharField(max_length=50, null=True, blank=True, unique=True)`
  - [ ] `created_at = models.DateTimeField(auto_now_add=True)`
  - [ ] `updated_at = models.DateTimeField(auto_now=True)`
- [ ] `class Meta`: `ordering = ['-created_at']`, `verbose_name = 'Customer'`, `verbose_name_plural = 'Customers'`
- [ ] `def __str__`: retornar `self.name`

## Migraciones

- [ ] `python manage.py makemigrations customers`
- [ ] `python manage.py migrate`

## Serializers (`customers/serializers.py`)

- [ ] `CustomerReadSerializer` — fields: `id`, `name`, `customer_type`, `email`, `phone`, `address`, `city`, `country`, `tax_id`, `created_at`, `updated_at`; `id`/`created_at`/`updated_at` `read_only=True`
- [ ] `CustomerWriteSerializer` — fields: `name`, `customer_type`, `email`, `phone`, `address`, `city`, `country`, `tax_id` (sin id, sin timestamps)
- [ ] `validate_email()` — unicidad excluyendo instancia actual (`qs.exclude(pk=self.instance.pk)` si `self.instance`)
- [ ] `validate_tax_id()` — si valor no es null: unicidad excluyendo instancia actual

## Views (`customers/views.py`)

- [ ] `CustomerViewSet(viewsets.ModelViewSet)`
- [ ] `queryset = Customer.objects.all()`
- [ ] `permission_classes = [IsAuthenticated]`
- [ ] `get_serializer_class()` → `CustomerReadSerializer` en `list`/`retrieve`, `CustomerWriteSerializer` en el resto
- [ ] `filterset_fields = ['customer_type', 'city', 'country']`
- [ ] `search_fields = ['name', 'email', 'phone']`
- [ ] `ordering_fields = ['name', 'created_at']`
- [ ] Override `create()` → WriteSerializer → service → `CustomerReadSerializer` 201
- [ ] Override `update()` → WriteSerializer (partial-aware) → service → `CustomerReadSerializer` 200
- [ ] Override `destroy()` → service → 204

## Service (`customers/services.py`)

- [ ] `CustomerService` con métodos estáticos:
  - [ ] `create_customer(data)` → `Customer.objects.create(**data)` + retornar instancia
  - [ ] `update_customer(instance, data)` → `setattr` por campo + `.save()` + retornar instancia
  - [ ] `delete_customer(instance)` → captura `ProtectedError` (shipments usa `on_delete=PROTECT`) → raise `ValidationError`; si no: `.delete()`

## URLs

- [ ] `customers/urls.py`: `DefaultRouter` + `router.register(r'customers', CustomerViewSet, basename='customer')`
- [ ] `config/urls.py`: agregar `path('api/', include('customers.urls'))`

## Admin (`customers/admin.py`)

- [ ] `CustomerAdmin(admin.ModelAdmin)`:
  - [ ] `list_display = ('id', 'name', 'customer_type', 'email', 'city', 'country', 'created_at')`
  - [ ] `list_filter = ('customer_type', 'city', 'country')`
  - [ ] `search_fields = ('name', 'email', 'tax_id')`
  - [ ] `readonly_fields = ('id', 'created_at', 'updated_at')`
- [ ] Registrar con `@admin.register(Customer)`

## Endpoints resultantes

| Método | URL | Acción |
|--------|-----|--------|
| GET | `/api/customers/` | Listar (paginado, filtrable) |
| POST | `/api/customers/` | Crear |
| GET | `/api/customers/{id}/` | Detalle |
| PUT | `/api/customers/{id}/` | Actualizar completo |
| PATCH | `/api/customers/{id}/` | Actualizar parcial |
| DELETE | `/api/customers/{id}/` | Eliminar |
