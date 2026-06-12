from datetime import date
from decimal import Decimal
from uuid import uuid4

from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import Shipment, ShipmentProduct

BASE_COST_PER_KG = Decimal('2.50')


def _get_full_shipment(pk):
    return (
        Shipment.objects
        .select_related('customer', 'origin_warehouse', 'transport', 'route')
        .prefetch_related('shipment_products__product')
        .get(pk=pk)
    )


class ShipmentService:

    @staticmethod
    def create_shipment(data: dict) -> Shipment:
        products_data = data.pop('products')
        tracking_number = f"SHIP-{date.today():%Y%m%d}-{uuid4().hex[:8].upper()}"
        base_cost = data['weight_kg'] * BASE_COST_PER_KG
        with transaction.atomic():
            shipment = Shipment.objects.create(
                tracking_number=tracking_number,
                base_cost=base_cost,
                **data,
            )
            for item in products_data:
                product = item['product']
                ShipmentProduct.objects.create(
                    shipment=shipment,
                    product=product,
                    quantity=item['quantity'],
                    unit_price_at_shipment=product.unit_price,
                )
        return _get_full_shipment(shipment.pk)

    @staticmethod
    def update_shipment(instance: Shipment, data: dict) -> Shipment:
        products_data = data.pop('products', None)
        with transaction.atomic():
            for field, value in data.items():
                setattr(instance, field, value)
            instance.save()
            if products_data is not None:
                instance.shipment_products.all().delete()
                for item in products_data:
                    product = item['product']
                    ShipmentProduct.objects.create(
                        shipment=instance,
                        product=product,
                        quantity=item['quantity'],
                        unit_price_at_shipment=product.unit_price,
                    )
        return _get_full_shipment(instance.pk)

    @staticmethod
    def delete_shipment(instance: Shipment) -> None:
        instance.delete()

    @staticmethod
    def assign_transport(instance: Shipment, transport, route=None) -> Shipment:
        if instance.status != Shipment.ShipmentStatus.PENDING:
            raise ValidationError('Shipment must be in pending status to assign transport.')
        instance.transport = transport
        instance.route = route
        instance.status = Shipment.ShipmentStatus.PICKED_UP
        instance.save()
        return _get_full_shipment(instance.pk)

    @staticmethod
    def mark_in_transit(instance: Shipment) -> Shipment:
        if instance.status != Shipment.ShipmentStatus.PICKED_UP:
            raise ValidationError('Shipment must be in picked_up status to mark as in_transit.')
        instance.status = Shipment.ShipmentStatus.IN_TRANSIT
        instance.save()
        return _get_full_shipment(instance.pk)

    @staticmethod
    def mark_delivered(instance: Shipment) -> Shipment:
        if instance.status not in (
            Shipment.ShipmentStatus.PICKED_UP,
            Shipment.ShipmentStatus.IN_TRANSIT,
        ):
            raise ValidationError('Shipment must be picked_up or in_transit to mark as delivered.')
        instance.status = Shipment.ShipmentStatus.DELIVERED
        instance.actual_delivery_date = date.today()
        instance.save()
        return _get_full_shipment(instance.pk)

    @staticmethod
    def cancel_shipment(instance: Shipment) -> Shipment:
        if instance.status not in (
            Shipment.ShipmentStatus.PENDING,
            Shipment.ShipmentStatus.PICKED_UP,
            Shipment.ShipmentStatus.IN_TRANSIT,
        ):
            raise ValidationError('Cannot cancel a delivered or already cancelled shipment.')
        instance.status = Shipment.ShipmentStatus.CANCELLED
        instance.save()
        return _get_full_shipment(instance.pk)
