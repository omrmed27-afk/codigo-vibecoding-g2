# Spec: Products App

## Nota previa
App `products` ya existe (creada con `startapp`). Implementar archivos vacíos + crear `serializers.py`, `services.py`, `urls.py`. Ya registrada en `INSTALLED_APPS`.

## Modelo (`products/models.py`)

- [ ] Crear clase `Product(models.Model)` con campos:
  - [ ] `name = models.CharField(max_length=200)`
  - [ ] `description = models.TextField(null=True, blank=True)`
  - [ ] `sku = models.CharField(max_length=100, unique=True)`
  - [ ] `weight_kg = models.DecimalField(max_digits=8, decimal_places=3)`
  - [ ] `width_cm = models.DecimalField(max_digits=8, decimal_places=2)`
  - [ ] `height_cm = models.DecimalField(max_digits=8, decimal_places=2)`
  - [ ] `depth_cm = models.DecimalField(max_digits=8, decimal_places=2)`
  - [ ] `unit_price = models.DecimalField(max_digits=12, decimal_places=2)`
  - [ ] `stock_quantity = models.IntegerField(default=0)`
  - [ ] `supplier = models.ForeignKey('suppliers.Supplier', on_delete=models.PROTECT)`
  - [ ] `warehouse = models.ForeignKey('warehouses.Warehouse', on_delete=models.PROTECT)`
  - [ ] `created_at = models.DateTimeField(auto_now_add=True)`
  - [ ] `updated_at = models.DateTimeField(auto_now=True)`
- [ ] `class Meta`: `ordering = ['-created_at']`, `verbose_name = 'Product'`, `verbose_name_plural = 'Products'`
- [ ] `def __str__`: retornar `f"{self.name} ({self.sku})"`

## Migraciones

- [ ] `python manage.py makemigrations products`
- [ ] `python manage.py migrate`

## Serializers (`products/serializers.py`)

- [ ] `SupplierSummarySerializer` — fields: `id`, `name` (solo para anidar en read)
- [ ] `WarehouseSummarySerializer` — fields: `id`, `name` (solo para anidar en read)
- [ ] `ProductReadSerializer` — fields: `id`, `name`, `description`, `sku`, `weight_kg`, `width_cm`, `height_cm`, `depth_cm`, `unit_price`, `stock_quantity`, `supplier` (anidado con SupplierSummarySerializer), `warehouse` (anidado con WarehouseSummarySerializer), `created_at`, `updated_at`; `id`/`created_at`/`updated_at` `read_only=True`
- [ ] `ProductWriteSerializer` — fields: `name`, `description`, `sku`, `weight_kg`, `width_cm`, `height_cm`, `depth_cm`, `unit_price`, `stock_quantity`, `supplier` (`PrimaryKeyRelatedField`), `warehouse` (`PrimaryKeyRelatedField`)
- [ ] `validate_sku()` — unicidad excluyendo instancia actual si `self.instance`

## Views (`products/views.py`)

- [ ] `ProductViewSet(viewsets.ModelViewSet)`
- [ ] `get_queryset()` → `Product.objects.select_related('supplier', 'warehouse').all()` — N+1 cero
- [ ] `permission_classes = [IsAuthenticated]`
- [ ] `get_serializer_class()` → `ProductReadSerializer` en `list`/`retrieve`, `ProductWriteSerializer` en el resto
- [ ] `filterset_fields = ['supplier', 'warehouse']`
- [ ] `search_fields = ['name', 'sku', 'description']`
- [ ] `ordering_fields = ['name', 'unit_price', 'stock_quantity', 'created_at']`
- [ ] Override `create()` → WriteSerializer → service → `ProductReadSerializer` 201
- [ ] Override `update()` → WriteSerializer (partial-aware) → service → `ProductReadSerializer` 200
- [ ] Override `destroy()` → service → 204

## Service (`products/services.py`)

- [ ] `ProductService` con métodos estáticos:
  - [ ] `create_product(data)` → `Product.objects.create(**data)` + retornar instancia con `select_related`
  - [ ] `update_product(instance, data)` → `setattr` por campo + `.save()` + retornar instancia
  - [ ] `delete_product(instance)` → captura `ProtectedError` (shipment_products usa `on_delete=PROTECT`) → raise `ValidationError`; si no: `.delete()`

## URLs

- [ ] `products/urls.py`: `DefaultRouter` + `router.register(r'products', ProductViewSet, basename='product')`
- [ ] `config/urls.py`: agregar `path('api/', include('products.urls'))`

## Admin (`products/admin.py`)

- [ ] `ProductAdmin(admin.ModelAdmin)`:
  - [ ] `list_display = ('id', 'name', 'sku', 'supplier', 'warehouse', 'stock_quantity', 'unit_price', 'created_at')`
  - [ ] `list_filter = ('supplier', 'warehouse')`
  - [ ] `search_fields = ('name', 'sku')`
  - [ ] `readonly_fields = ('id', 'created_at', 'updated_at')`
- [ ] Registrar con `@admin.register(Product)`

## Endpoints resultantes

| Método | URL | Acción |
|--------|-----|--------|
| GET | `/api/products/` | Listar (paginado, filtrable) |
| POST | `/api/products/` | Crear |
| GET | `/api/products/{id}/` | Detalle |
| PUT | `/api/products/{id}/` | Actualizar completo |
| PATCH | `/api/products/{id}/` | Actualizar parcial |
| DELETE | `/api/products/{id}/` | Eliminar |
