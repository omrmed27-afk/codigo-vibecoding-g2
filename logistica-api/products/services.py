from django.db.models import ProtectedError
from rest_framework.exceptions import ValidationError

from .models import Product


class ProductService:

    @staticmethod
    def create_product(data: dict) -> Product:
        instance = Product.objects.create(**data)
        return Product.objects.select_related('supplier', 'warehouse').get(pk=instance.pk)

    @staticmethod
    def update_product(instance: Product, data: dict) -> Product:
        for field, value in data.items():
            setattr(instance, field, value)
        instance.save()
        return Product.objects.select_related('supplier', 'warehouse').get(pk=instance.pk)

    @staticmethod
    def delete_product(instance: Product) -> None:
        # shipments_shipmentproduct references products_product with on_delete=PROTECT.
        # Attempting to delete a product that is part of any shipment raises a
        # ProtectedError. We re-raise it as a ValidationError so the
        # custom_exception_handler converts it to a 400 JSON response.
        try:
            instance.delete()
        except ProtectedError as exc:
            raise ValidationError(
                'Cannot delete product: it is referenced by existing shipments.'
            ) from exc
