from django.db import models


class Transport(models.Model):
    class TransportType(models.TextChoices):
        TRUCK = 'truck', 'Truck'
        VAN = 'van', 'Van'
        MOTORCYCLE = 'motorcycle', 'Motorcycle'
        BICYCLE = 'bicycle', 'Bicycle'

    class TransportStatus(models.TextChoices):
        AVAILABLE = 'available', 'Available'
        IN_TRANSIT = 'in_transit', 'In Transit'
        MAINTENANCE = 'maintenance', 'Maintenance'

    name = models.CharField(max_length=200)
    type = models.CharField(max_length=15, choices=TransportType.choices)
    plate_number = models.CharField(max_length=20, unique=True)
    capacity_kg = models.DecimalField(max_digits=8, decimal_places=2)
    capacity_m3 = models.DecimalField(max_digits=8, decimal_places=3)
    driver = models.ForeignKey(
        'drivers.Driver',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=15,
        choices=TransportStatus.choices,
        default=TransportStatus.AVAILABLE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Transport'
        verbose_name_plural = 'Transports'

    def __str__(self):
        return f"{self.name} ({self.plate_number})"
