from django.db.models import ProtectedError
from rest_framework.exceptions import ValidationError

from .models import Customer


class CustomerService:

    @staticmethod
    def create_customer(data: dict) -> Customer:
        return Customer.objects.create(**data)

    @staticmethod
    def update_customer(instance: Customer, data: dict) -> Customer:
        for field, value in data.items():
            setattr(instance, field, value)
        instance.save()
        return instance

    @staticmethod
    def delete_customer(instance: Customer) -> None:
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError(
                'This customer cannot be deleted because it has associated shipments.'
            )
