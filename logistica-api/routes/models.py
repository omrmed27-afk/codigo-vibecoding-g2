from django.db import models


class Route(models.Model):
    class RouteStatus(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'

    name = models.CharField(max_length=200)
    origin_warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.PROTECT,
    )
    status = models.CharField(
        max_length=10,
        choices=RouteStatus.choices,
        default=RouteStatus.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Route'
        verbose_name_plural = 'Routes'

    def __str__(self):
        return self.name


class RouteStop(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stops')
    stop_order = models.IntegerField()
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('route', 'stop_order')]
        ordering = ['stop_order']
        verbose_name = 'Route Stop'
        verbose_name_plural = 'Route Stops'

    def __str__(self):
        return f"Stop {self.stop_order} — {self.city}"
