from django.db import models


class Warehouse(models.Model):
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Warehouse'
        verbose_name_plural = 'Warehouses'

    def __str__(self):
        return self.name
