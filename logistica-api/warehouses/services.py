from django.core.exceptions import ValidationError
from .models import Warehouse


class WarehouseService:

    @staticmethod
    def create_warehouse(data: dict) -> Warehouse:
        warehouse = Warehouse(**data)
        warehouse.save()
        return warehouse

    @staticmethod
    def update_warehouse(instance: Warehouse, data: dict) -> Warehouse:
        for field, value in data.items():
            setattr(instance, field, value)
        instance.save()
        return instance

    @staticmethod
    def delete_warehouse(instance: Warehouse) -> None:
        # Check for dependent objects protected by on_delete=PROTECT.
        # products_product, routes_route, and shipments_shipment all reference
        # warehouses_warehouse with PROTECT; attempting to delete a warehouse
        # that has any of these dependents raises a database-level ProtectedError.
        # We catch that Django error and re-raise it as a ValidationError so the
        # custom_exception_handler can convert it to a 400 JSON response.
        from django.db.models import ProtectedError

        try:
            instance.delete()
        except ProtectedError as exc:
            raise ValidationError(
                'Cannot delete warehouse: it is referenced by existing products, '
                'routes, or shipments.'
            ) from exc
