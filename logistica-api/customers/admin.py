from django.contrib import admin

from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'customer_type', 'email', 'city', 'country', 'created_at')
    list_filter = ('customer_type', 'city', 'country')
    search_fields = ('name', 'email', 'tax_id')
    readonly_fields = ('id', 'created_at', 'updated_at')
