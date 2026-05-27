from django.db import models


class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    sku = models.CharField(max_length=100, unique=True)
    weight_kg = models.DecimalField(max_digits=8, decimal_places=3)
    width_cm = models.DecimalField(max_digits=8, decimal_places=2)
    height_cm = models.DecimalField(max_digits=8, decimal_places=2)
    depth_cm = models.DecimalField(max_digits=8, decimal_places=2)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    stock_quantity = models.IntegerField(default=0)
    supplier = models.ForeignKey(
        'suppliers.Supplier',
        on_delete=models.PROTECT,
        related_name='products',
    )
    warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.PROTECT,
        related_name='products',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Product'
        verbose_name_plural = 'Products'

    def __str__(self):
        return f"{self.name} ({self.sku})"
