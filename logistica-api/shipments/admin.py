from django.contrib import admin
from .models import Shipment, ShipmentProduct


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'tracking_number', 'customer', 'status', 'scheduled_delivery_date', 'base_cost', 'created_at')
    list_filter = ('status',)
    search_fields = ('tracking_number',)
    readonly_fields = ('id', 'tracking_number', 'base_cost', 'created_at', 'updated_at')


@admin.register(ShipmentProduct)
class ShipmentProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'shipment', 'product', 'quantity', 'unit_price_at_shipment')
    list_filter = ('shipment',)
    readonly_fields = ('id', 'unit_price_at_shipment', 'created_at')
