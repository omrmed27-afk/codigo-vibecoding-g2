from django.contrib import admin

from .models import Driver


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'license_number', 'status', 'phone', 'created_at')
    list_filter = ('status',)
    search_fields = ('user__username', 'user__email', 'license_number')
    readonly_fields = ('id', 'created_at', 'updated_at')
