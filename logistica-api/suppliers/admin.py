from django.contrib import admin

from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'contact_name', 'email', 'city', 'country', 'created_at')
    list_filter = ('city', 'country')
    search_fields = ('name', 'contact_name', 'email')
    readonly_fields = ('id', 'created_at', 'updated_at')
