from django.db import models


class Customer(models.Model):

    class CustomerType(models.TextChoices):
        INDIVIDUAL = 'individual', 'Individual'
        COMPANY = 'company', 'Company'

    name = models.CharField(max_length=200)
    customer_type = models.CharField(max_length=10, choices=CustomerType.choices)
    email = models.EmailField(max_length=254, unique=True)
    phone = models.CharField(max_length=30)
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    tax_id = models.CharField(max_length=50, null=True, blank=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'

    def __str__(self):
        return self.name
