from django.db.models import ProtectedError
from rest_framework.exceptions import ValidationError

from .models import Supplier


class SupplierService:

    @staticmethod
    def create_supplier(data: dict) -> Supplier:
        return Supplier.objects.create(**data)

    @staticmethod
    def update_supplier(instance: Supplier, data: dict) -> Supplier:
        for field, value in data.items():
            setattr(instance, field, value)
        instance.save()
        return instance

    @staticmethod
    def delete_supplier(instance: Supplier) -> None:
        # products_product references suppliers_supplier with on_delete=PROTECT.
        # Attempting to delete a supplier that has associated products raises
        # a ProtectedError. We catch it and re-raise as a DRF ValidationError
        # so the custom_exception_handler returns a consistent 400 JSON response.
        try:
            instance.delete()
        except ProtectedError as exc:
            raise ValidationError(
                'Cannot delete supplier: it is referenced by existing products.'
            ) from exc
