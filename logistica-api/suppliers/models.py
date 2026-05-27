from django.db import models


class Supplier(models.Model):
    name = models.CharField(max_length=200)
    contact_name = models.CharField(max_length=200)
    email = models.EmailField(max_length=254, unique=True)
    phone = models.CharField(max_length=30)
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Supplier'
        verbose_name_plural = 'Suppliers'

    def __str__(self):
        return self.name
