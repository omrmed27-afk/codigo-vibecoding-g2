from django.db import models
from django.conf import settings


class Driver(models.Model):

    class DriverStatus(models.TextChoices):
        AVAILABLE = 'available', 'Available'
        BUSY = 'busy', 'Busy'
        OFF_DUTY = 'off_duty', 'Off Duty'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='driver_profile',
    )
    license_number = models.CharField(max_length=50, unique=True)
    license_expiry = models.DateField()
    phone = models.CharField(max_length=30)
    status = models.CharField(
        max_length=10,
        choices=DriverStatus.choices,
        default=DriverStatus.AVAILABLE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Driver'
        verbose_name_plural = 'Drivers'

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.license_number})"
