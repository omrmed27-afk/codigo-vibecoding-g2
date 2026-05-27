from django.db import models


class Shipment(models.Model):
    class ShipmentStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PICKED_UP = 'picked_up', 'Picked Up'
        IN_TRANSIT = 'in_transit', 'In Transit'
        DELIVERED = 'delivered', 'Delivered'
        CANCELLED = 'cancelled', 'Cancelled'

    tracking_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey('customers.Customer', on_delete=models.PROTECT)
    origin_warehouse = models.ForeignKey('warehouses.Warehouse', on_delete=models.PROTECT)
    destination_address = models.CharField(max_length=500)
    destination_city = models.CharField(max_length=100)
    destination_country = models.CharField(max_length=100)
    status = models.CharField(
        max_length=15,
        choices=ShipmentStatus.choices,
        default=ShipmentStatus.PENDING,
    )
    transport = models.ForeignKey(
        'transport.Transport',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    route = models.ForeignKey(
        'routes.Route',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    scheduled_delivery_date = models.DateField()
    actual_delivery_date = models.DateField(null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=8, decimal_places=3)
    base_cost = models.DecimalField(max_digits=12, decimal_places=2)
    calculated_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Shipment'
        verbose_name_plural = 'Shipments'

    def __str__(self):
        return f"{self.tracking_number} ({self.status})"


class ShipmentProduct(models.Model):
    shipment = models.ForeignKey(
        Shipment,
        on_delete=models.CASCADE,
        related_name='shipment_products',
    )
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price_at_shipment = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('shipment', 'product')]
        ordering = ['id']
        verbose_name = 'Shipment Product'
        verbose_name_plural = 'Shipment Products'

    def __str__(self):
        return f"{self.product.name} x{self.quantity}"
