from django.contrib import admin
from .models import Route, RouteStop


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'origin_warehouse', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('name',)
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(RouteStop)
class RouteStopAdmin(admin.ModelAdmin):
    list_display = ('id', 'route', 'stop_order', 'city', 'address')
    list_filter = ('route',)
    readonly_fields = ('id', 'created_at')
