from django.contrib import admin
from .models import Warehouse


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'city', 'country', 'is_active', 'created_at')
    list_filter = ('is_active', 'city', 'country')
    search_fields = ('name', 'address', 'city')
    readonly_fields = ('id', 'created_at', 'updated_at')
