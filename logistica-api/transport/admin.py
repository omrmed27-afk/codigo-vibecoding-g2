from django.contrib import admin
from .models import Transport


@admin.register(Transport)
class TransportAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'type', 'plate_number', 'driver', 'status', 'created_at')
    list_filter = ('status', 'type')
    search_fields = ('name', 'plate_number')
    readonly_fields = ('id', 'created_at', 'updated_at')
