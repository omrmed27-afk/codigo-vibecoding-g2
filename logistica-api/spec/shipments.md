# Spec: Shipments App

## Nota previa

App `shipments` debe crearse con `startapp`. Registrar en `INSTALLED_APPS`. Es el módulo núcleo — depende de customers, warehouses, transport, routes, products.

## Modelos (`shipments/models.py`)

### `Shipment`

- [ ] Crear clase `Shipment(models.Model)` con clase anidada `ShipmentStatus(models.TextChoices)`:
  - [ ] `PENDING = 'pending', 'Pending'`
  - [ ] `PICKED_UP = 'picked_up', 'Picked Up'`
  - [ ] `IN_TRANSIT = 'in_transit', 'In Transit'`
  - [ ] `DELIVERED = 'delivered', 'Delivered'`
  - [ ] `CANCELLED = 'cancelled', 'Cancelled'`
- [ ] Campos:
  - [ ] `tracking_number = models.CharField(max_length=50, unique=True)` — generado en service, no en modelo
  - [ ] `customer = models.ForeignKey('customers.Customer', on_delete=models.PROTECT)`
  - [ ] `origin_warehouse = models.ForeignKey('warehouses.Warehouse', on_delete=models.PROTECT)`
  - [ ] `destination_address = models.CharField(max_length=500)`
  - [ ] `destination_city = models.CharField(max_length=100)`
  - [ ] `destination_country = models.CharField(max_length=100)`
  - [ ] `status = models.CharField(max_length=15, choices=ShipmentStatus.choices, default=ShipmentStatus.PENDING)`
  - [ ] `transport = models.ForeignKey('transport.Transport', on_delete=models.SET_NULL, null=True, blank=True)`
  - [ ] `route = models.ForeignKey('routes.Route', on_delete=models.SET_NULL, null=True, blank=True)`
  - [ ] `scheduled_delivery_date = models.DateField()`
  - [ ] `actual_delivery_date = models.DateField(null=True, blank=True)`
  - [ ] `weight_kg = models.DecimalField(max_digits=8, decimal_places=3)`
  - [ ] `base_cost = models.DecimalField(max_digits=12, decimal_places=2)`
  - [ ] `calculated_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)`
  - [ ] `notes = models.TextField(null=True, blank=True)`
  - [ ] `created_at = models.DateTimeField(auto_now_add=True)`
  - [ ] `updated_at = models.DateTimeField(auto_now=True)`
- [ ] `class Meta`: `ordering = ['-created_at']`, `verbose_name = 'Shipment'`, `verbose_name_plural = 'Shipments'`
- [ ] `def __str__`: retornar `f"{self.tracking_number} ({self.status})"`

### `ShipmentProduct`

- [ ] Crear clase `ShipmentProduct(models.Model)` con campos:
  - [ ] `shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='shipment_products')`
  - [ ] `product = models.ForeignKey('products.Product', on_delete=models.PROTECT)`
  - [ ] `quantity = models.PositiveIntegerField()`
  - [ ] `unit_price_at_shipment = models.DecimalField(max_digits=12, decimal_places=2)`
  - [ ] `created_at = models.DateTimeField(auto_now_add=True)`
- [ ] `class Meta`: `unique_together = [('shipment', 'product')]`, `ordering = ['id']`, `verbose_name = 'Shipment Product'`, `verbose_name_plural = 'Shipment Products'`
- [ ] `def __str__`: retornar `f"{self.product.name} x{self.quantity}"`

## Migraciones

- [ ] `python manage.py makemigrations shipments`
- [ ] `python manage.py migrate`

## Serializers (`shipments/serializers.py`)

### Summary serializers (solo lectura, para anidar)

- [ ] `CustomerSummarySerializer` — fields: `id`, `name`, `email` (todos read_only)
- [ ] `WarehouseSummarySerializer` — fields: `id`, `name`, `city` (todos read_only)
- [ ] `TransportSummarySerializer` — fields: `id`, `name`, `plate_number`, `status` (todos read_only)
- [ ] `RouteSummarySerializer` — fields: `id`, `name`, `status` (todos read_only)
- [ ] `ProductSummarySerializer` — fields: `id`, `name`, `sku`, `unit_price` (todos read_only)

### ShipmentProduct serializers

- [ ] `ShipmentProductReadSerializer` — fields: `id`, `product` (anidado ProductSummarySerializer, read_only), `quantity`, `unit_price_at_shipment`, `created_at` (read_only)
- [ ] `ShipmentProductWriteSerializer` — fields: `product` (`PrimaryKeyRelatedField`, queryset=Product.objects.all()), `quantity` (`IntegerField`, min_value=1)

### Shipment serializers

- [ ] `ShipmentReadSerializer` — fields: `id`, `tracking_number`, `customer` (anidado), `origin_warehouse` (anidado), `destination_address`, `destination_city`, `destination_country`, `status`, `transport` (anidado, allow_null), `route` (anidado, allow_null), `scheduled_delivery_date`, `actual_delivery_date`, `weight_kg`, `base_cost`, `calculated_cost`, `notes`, `shipment_products` (ShipmentProductReadSerializer many=True, read_only), `created_at`, `updated_at`; todos los campos auto-generados `read_only=True`
- [ ] `ShipmentWriteSerializer` — fields: `customer` (PK), `origin_warehouse` (PK), `destination_address`, `destination_city`, `destination_country`, `scheduled_delivery_date`, `weight_kg`, `notes`, `products` (ShipmentProductWriteSerializer many=True, required=True)
  - [ ] `validate_products(value)`: si lista vacía → `ValidationError`; si hay product_ids duplicados → `ValidationError`
  - [ ] Ausentes del write serializer: `status`, `tracking_number`, `base_cost`, `calculated_cost`, `actual_delivery_date`, `transport`, `route` (todos los maneja el service)

## Views (`shipments/views.py`)

- [ ] `ShipmentViewSet(viewsets.ModelViewSet)`
- [ ] `get_queryset()` → `Shipment.objects.select_related('customer', 'origin_warehouse', 'transport', 'route').prefetch_related('shipment_products__product').all()`
- [ ] `permission_classes = [IsAuthenticated]`
- [ ] `get_serializer_class()` → `ShipmentReadSerializer` en `list`/`retrieve`, `ShipmentWriteSerializer` en el resto
- [ ] `filterset_fields = ['status', 'customer', 'origin_warehouse', 'transport']`
- [ ] `search_fields = ['tracking_number', 'destination_city', 'destination_country']`
- [ ] `ordering_fields = ['created_at', 'scheduled_delivery_date', 'base_cost']`
- [ ] Override `create()` → WriteSerializer → service → `ShipmentReadSerializer` 201
- [ ] Override `update()` → WriteSerializer (partial-aware) → service → `ShipmentReadSerializer` 200
- [ ] Override `destroy()` → service → 204
- [ ] `@action(detail=True, methods=['post'], url_path='assign-transport')`:
  - [ ] Body: `{transport_id, route_id (opcional)}`
  - [ ] Validar transport_id existe → `get_object_or_404(Transport, pk=transport_id)`
  - [ ] route_id opcional → `get_object_or_404(Route, pk=route_id)` si presente
  - [ ] `ShipmentService.assign_transport(instance, transport, route)` → `ShipmentReadSerializer` 200
- [ ] `@action(detail=True, methods=['post'], url_path='mark-delivered')`:
  - [ ] Sin body → `ShipmentService.mark_delivered(instance)` → `ShipmentReadSerializer` 200
- [ ] `@action(detail=True, methods=['post'], url_path='cancel')`:
  - [ ] Sin body → `ShipmentService.cancel_shipment(instance)` → `ShipmentReadSerializer` 200

## Service (`shipments/services.py`)

- [ ] `ShipmentService` con métodos estáticos:

  - [ ] `create_shipment(data)` → `transaction.atomic()`:
    1. `tracking_number = f"SHIP-{date.today():%Y%m%d}-{uuid4().hex[:8].upper()}"`
    2. `base_cost = data['weight_kg'] * Decimal('2.50')`
    3. `products_data = data.pop('products')`
    4. Crear `Shipment` con `tracking_number`, `base_cost`, y resto de `data`
    5. Para cada product_data: `product = product_data['product']`, crear `ShipmentProduct(shipment=shipment, product=product, quantity=product_data['quantity'], unit_price_at_shipment=product.unit_price)`
    6. Retornar con `select_related('customer','origin_warehouse','transport','route').prefetch_related('shipment_products__product').get(pk=shipment.pk)`

  - [ ] `update_shipment(instance, data)` → `transaction.atomic()`:
    - `products_data = data.pop('products', None)`
    - setattr + save en campos restantes
    - Si `products_data is not None`: `instance.shipment_products.all().delete()` + recrear con snapshot
    - Retornar con select_related/prefetch_related

  - [ ] `delete_shipment(instance)` → `.delete()` directo (CASCADE elimina ShipmentProducts)

  - [ ] `assign_transport(instance, transport, route=None)`:
    - Si `instance.status != 'pending'` → raise `ValidationError('Shipment must be in pending status to assign transport.')`
    - `instance.transport = transport`
    - `instance.route = route`
    - `instance.status = Shipment.ShipmentStatus.PICKED_UP`
    - `instance.save()`
    - Retornar con select_related/prefetch_related

  - [ ] `mark_delivered(instance)`:
    - Si `instance.status` not in `('picked_up', 'in_transit')` → raise `ValidationError('Shipment must be picked_up or in_transit to mark as delivered.')`
    - `instance.status = Shipment.ShipmentStatus.DELIVERED`
    - `instance.actual_delivery_date = date.today()`
    - `instance.save()`
    - Retornar con select_related/prefetch_related

  - [ ] `cancel_shipment(instance)`:
    - Si `instance.status` not in `('pending', 'picked_up', 'in_transit')` → raise `ValidationError('Cannot cancel a delivered or already cancelled shipment.')`
    - `instance.status = Shipment.ShipmentStatus.CANCELLED`
    - `instance.save()`
    - Retornar con select_related/prefetch_related

## URLs

- [ ] `shipments/urls.py`: `DefaultRouter` + `router.register(r'shipments', ShipmentViewSet, basename='shipment')`
- [ ] `config/urls.py`: agregar `path('api/', include('shipments.urls'))`

## Admin (`shipments/admin.py`)

- [ ] `ShipmentAdmin(admin.ModelAdmin)`:
  - [ ] `list_display = ('id', 'tracking_number', 'customer', 'status', 'scheduled_delivery_date', 'base_cost', 'created_at')`
  - [ ] `list_filter = ('status',)`
  - [ ] `search_fields = ('tracking_number',)`
  - [ ] `readonly_fields = ('id', 'tracking_number', 'base_cost', 'created_at', 'updated_at')`
- [ ] `ShipmentProductAdmin(admin.ModelAdmin)`:
  - [ ] `list_display = ('id', 'shipment', 'product', 'quantity', 'unit_price_at_shipment')`
  - [ ] `list_filter = ('shipment',)`
  - [ ] `readonly_fields = ('id', 'unit_price_at_shipment', 'created_at')`
- [ ] Registrar ambos con `@admin.register`

## Endpoints resultantes

| Método | URL | Acción |
|--------|-----|--------|
| GET | `/api/shipments/` | Listar (paginado, filtrable) |
| POST | `/api/shipments/` | Crear envío con productos |
| GET | `/api/shipments/{id}/` | Detalle completo con relaciones anidadas |
| PUT | `/api/shipments/{id}/` | Actualizar completo |
| PATCH | `/api/shipments/{id}/` | Actualizar parcial |
| DELETE | `/api/shipments/{id}/` | Eliminar envío y sus líneas (CASCADE) |
| POST | `/api/shipments/{id}/assign-transport/` | Asignar transporte → status `picked_up` |
| POST | `/api/shipments/{id}/mark-delivered/` | Marcar entregado → status `delivered` |
| POST | `/api/shipments/{id}/cancel/` | Cancelar → status `cancelled` |
