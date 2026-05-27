"""
Tests for shipments.services.ShipmentService.

Covers:
- create_shipment: tracking_number generated, base_cost calculated, products stored
- create_shipment: atomicity (if one product fails, nothing persists)
- update_shipment: fields updated, products replaced when provided, products unchanged when omitted
- delete_shipment: removes the instance
- assign_transport: happy path → status becomes picked_up; invalid status → ValidationError
- mark_delivered: from picked_up → delivered; from in_transit → delivered; invalid state → ValidationError
- cancel_shipment: from pending/picked_up/in_transit → cancelled; from delivered/cancelled → ValidationError
- Edge cases: weight_kg = 0.001, base_cost calculation accuracy
"""
import datetime
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from rest_framework.exceptions import ValidationError

from shipments.models import Shipment, ShipmentProduct
from shipments.services import ShipmentService, BASE_COST_PER_KG

from .fixtures import (
    make_warehouse,
    make_supplier,
    make_customer,
    make_product,
    make_driver_user,
    make_driver,
    make_transport,
    make_route,
    make_shipment,
    make_shipment_product,
)


class CreateShipmentServiceTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()
        self.supplier = make_supplier()
        self.customer = make_customer()
        self.product = make_product(self.supplier, self.warehouse)
        self.base_data = {
            'customer': self.customer,
            'origin_warehouse': self.warehouse,
            'destination_address': '100 Main St',
            'destination_city': 'Bogota',
            'destination_country': 'Colombia',
            'scheduled_delivery_date': datetime.date(2026, 7, 1),
            'weight_kg': Decimal('5.000'),
            'notes': None,
        }

    def _make_data(self, products=None):
        data = dict(self.base_data)
        data['products'] = products or [{'product': self.product, 'quantity': 2}]
        return data

    # ------------------------------------------------------------------ happy path
    def test_create_shipment_returns_shipment_instance(self):
        shipment = ShipmentService.create_shipment(self._make_data())
        self.assertIsInstance(shipment, Shipment)

    def test_create_shipment_generates_tracking_number(self):
        shipment = ShipmentService.create_shipment(self._make_data())
        self.assertTrue(shipment.tracking_number.startswith('SHIP-'))
        self.assertGreater(len(shipment.tracking_number), 10)

    def test_create_shipment_tracking_number_unique(self):
        s1 = ShipmentService.create_shipment(self._make_data())
        s2 = ShipmentService.create_shipment(self._make_data())
        self.assertNotEqual(s1.tracking_number, s2.tracking_number)

    def test_create_shipment_calculates_base_cost(self):
        shipment = ShipmentService.create_shipment(self._make_data())
        expected = Decimal('5.000') * BASE_COST_PER_KG
        self.assertEqual(shipment.base_cost, expected)

    def test_create_shipment_stores_products(self):
        shipment = ShipmentService.create_shipment(self._make_data())
        self.assertEqual(shipment.shipment_products.count(), 1)
        sp = shipment.shipment_products.first()
        self.assertEqual(sp.quantity, 2)

    def test_create_shipment_snapshot_unit_price(self):
        """unit_price_at_shipment must equal product.unit_price at creation time."""
        shipment = ShipmentService.create_shipment(self._make_data())
        sp = shipment.shipment_products.first()
        self.assertEqual(sp.unit_price_at_shipment, self.product.unit_price)

    def test_create_shipment_status_defaults_to_pending(self):
        shipment = ShipmentService.create_shipment(self._make_data())
        self.assertEqual(shipment.status, Shipment.ShipmentStatus.PENDING)

    def test_create_shipment_multiple_products(self):
        product2 = make_product(
            self.supplier, self.warehouse, sku='MOUSE-002',
            name='Mouse', unit_price=Decimal('25.00'),
            weight_kg=Decimal('0.200'),
        )
        data = self._make_data(products=[
            {'product': self.product, 'quantity': 1},
            {'product': product2, 'quantity': 3},
        ])
        shipment = ShipmentService.create_shipment(data)
        self.assertEqual(shipment.shipment_products.count(), 2)

    # ------------------------------------------------------------------ edge cases
    def test_create_shipment_minimum_weight(self):
        """
        base_cost field is DECIMAL(12,2) — values are rounded to 2 decimal places
        by SQLite. weight_kg=0.001 * 2.50 = 0.0025, stored as 0.00.
        The test verifies the shipment is created successfully (no exception).
        """
        data = self._make_data()
        data['weight_kg'] = Decimal('0.001')
        shipment = ShipmentService.create_shipment(data)
        self.assertIsNotNone(shipment.pk)
        # base_cost is rounded to 2dp by the DB (0.0025 -> 0.00)
        self.assertEqual(shipment.base_cost, Decimal('0.00'))

    # ------------------------------------------------------------------ atomicity
    def test_create_shipment_is_atomic_on_invalid_product(self):
        """If one product line fails, no Shipment should be persisted."""
        from unittest.mock import patch
        original_count = Shipment.objects.count()

        class FakeProduct:
            id = 99999
            unit_price = Decimal('10.00')

        data = self._make_data(products=[{'product': FakeProduct(), 'quantity': 1}])

        with self.assertRaises(Exception):
            ShipmentService.create_shipment(data)

        self.assertEqual(Shipment.objects.count(), original_count)


class UpdateShipmentServiceTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()
        self.supplier = make_supplier()
        self.customer = make_customer()
        self.product = make_product(self.supplier, self.warehouse)
        self.shipment = make_shipment(self.customer, self.warehouse)
        make_shipment_product(self.shipment, self.product, quantity=1)

    def test_update_shipment_changes_fields(self):
        updated = ShipmentService.update_shipment(
            self.shipment,
            {'destination_city': 'Medellin'},
        )
        self.assertEqual(updated.destination_city, 'Medellin')

    def test_update_shipment_without_products_preserves_existing(self):
        updated = ShipmentService.update_shipment(
            self.shipment,
            {'destination_city': 'Cali'},
        )
        self.assertEqual(updated.shipment_products.count(), 1)

    def test_update_shipment_replaces_products_when_provided(self):
        product2 = make_product(
            self.supplier, self.warehouse, sku='TABLET-003',
            name='Tablet', unit_price=Decimal('600.00'),
            weight_kg=Decimal('0.500'),
        )
        updated = ShipmentService.update_shipment(
            self.shipment,
            {'products': [{'product': product2, 'quantity': 5}]},
        )
        self.assertEqual(updated.shipment_products.count(), 1)
        sp = updated.shipment_products.first()
        self.assertEqual(sp.product, product2)
        self.assertEqual(sp.quantity, 5)

    def test_update_shipment_returns_shipment_instance(self):
        result = ShipmentService.update_shipment(self.shipment, {})
        self.assertIsInstance(result, Shipment)


class DeleteShipmentServiceTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()
        self.supplier = make_supplier()
        self.customer = make_customer()
        self.shipment = make_shipment(self.customer, self.warehouse)

    def test_delete_shipment_removes_instance(self):
        pk = self.shipment.pk
        ShipmentService.delete_shipment(self.shipment)
        self.assertFalse(Shipment.objects.filter(pk=pk).exists())


class AssignTransportServiceTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()
        self.supplier = make_supplier()
        self.customer = make_customer()
        self.product = make_product(self.supplier, self.warehouse)
        driver_user = make_driver_user()
        self.driver = make_driver(driver_user)
        self.transport = make_transport(self.driver)
        self.route = make_route(self.warehouse)
        self.shipment = make_shipment(self.customer, self.warehouse)

    # ------------------------------------------------------------------ happy path
    def test_assign_transport_changes_status_to_picked_up(self):
        result = ShipmentService.assign_transport(self.shipment, self.transport)
        self.assertEqual(result.status, Shipment.ShipmentStatus.PICKED_UP)

    def test_assign_transport_sets_transport(self):
        result = ShipmentService.assign_transport(self.shipment, self.transport)
        self.assertEqual(result.transport.pk, self.transport.pk)

    def test_assign_transport_with_route(self):
        result = ShipmentService.assign_transport(self.shipment, self.transport, self.route)
        self.assertEqual(result.route.pk, self.route.pk)

    def test_assign_transport_without_route_sets_none(self):
        result = ShipmentService.assign_transport(self.shipment, self.transport, None)
        self.assertIsNone(result.route)

    # ------------------------------------------------------------------ unhappy path
    def test_assign_transport_to_non_pending_raises_validation_error(self):
        self.shipment.status = Shipment.ShipmentStatus.IN_TRANSIT
        self.shipment.save()
        with self.assertRaises(ValidationError):
            ShipmentService.assign_transport(self.shipment, self.transport)

    def test_assign_transport_to_delivered_raises_validation_error(self):
        self.shipment.status = Shipment.ShipmentStatus.DELIVERED
        self.shipment.save()
        with self.assertRaises(ValidationError):
            ShipmentService.assign_transport(self.shipment, self.transport)

    def test_assign_transport_to_cancelled_raises_validation_error(self):
        self.shipment.status = Shipment.ShipmentStatus.CANCELLED
        self.shipment.save()
        with self.assertRaises(ValidationError):
            ShipmentService.assign_transport(self.shipment, self.transport)


class MarkDeliveredServiceTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()
        self.supplier = make_supplier()
        self.customer = make_customer()
        driver_user = make_driver_user()
        self.driver = make_driver(driver_user)
        self.transport = make_transport(self.driver)
        self.shipment = make_shipment(self.customer, self.warehouse)

    # ------------------------------------------------------------------ happy path
    def test_mark_delivered_from_picked_up(self):
        self.shipment.status = Shipment.ShipmentStatus.PICKED_UP
        self.shipment.save()
        result = ShipmentService.mark_delivered(self.shipment)
        self.assertEqual(result.status, Shipment.ShipmentStatus.DELIVERED)

    def test_mark_delivered_from_in_transit(self):
        self.shipment.status = Shipment.ShipmentStatus.IN_TRANSIT
        self.shipment.save()
        result = ShipmentService.mark_delivered(self.shipment)
        self.assertEqual(result.status, Shipment.ShipmentStatus.DELIVERED)

    def test_mark_delivered_sets_actual_delivery_date(self):
        self.shipment.status = Shipment.ShipmentStatus.PICKED_UP
        self.shipment.save()
        result = ShipmentService.mark_delivered(self.shipment)
        self.assertIsNotNone(result.actual_delivery_date)

    # ------------------------------------------------------------------ unhappy path
    def test_mark_delivered_from_pending_raises_validation_error(self):
        with self.assertRaises(ValidationError):
            ShipmentService.mark_delivered(self.shipment)

    def test_mark_delivered_from_cancelled_raises_validation_error(self):
        self.shipment.status = Shipment.ShipmentStatus.CANCELLED
        self.shipment.save()
        with self.assertRaises(ValidationError):
            ShipmentService.mark_delivered(self.shipment)

    def test_mark_delivered_from_delivered_raises_validation_error(self):
        self.shipment.status = Shipment.ShipmentStatus.DELIVERED
        self.shipment.save()
        with self.assertRaises(ValidationError):
            ShipmentService.mark_delivered(self.shipment)


class CancelShipmentServiceTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()
        self.supplier = make_supplier()
        self.customer = make_customer()
        self.shipment = make_shipment(self.customer, self.warehouse)

    # ------------------------------------------------------------------ happy path
    def test_cancel_from_pending(self):
        result = ShipmentService.cancel_shipment(self.shipment)
        self.assertEqual(result.status, Shipment.ShipmentStatus.CANCELLED)

    def test_cancel_from_picked_up(self):
        self.shipment.status = Shipment.ShipmentStatus.PICKED_UP
        self.shipment.save()
        result = ShipmentService.cancel_shipment(self.shipment)
        self.assertEqual(result.status, Shipment.ShipmentStatus.CANCELLED)

    def test_cancel_from_in_transit(self):
        self.shipment.status = Shipment.ShipmentStatus.IN_TRANSIT
        self.shipment.save()
        result = ShipmentService.cancel_shipment(self.shipment)
        self.assertEqual(result.status, Shipment.ShipmentStatus.CANCELLED)

    # ------------------------------------------------------------------ unhappy path
    def test_cancel_from_delivered_raises_validation_error(self):
        self.shipment.status = Shipment.ShipmentStatus.DELIVERED
        self.shipment.save()
        with self.assertRaises(ValidationError):
            ShipmentService.cancel_shipment(self.shipment)

    def test_cancel_from_cancelled_raises_validation_error(self):
        self.shipment.status = Shipment.ShipmentStatus.CANCELLED
        self.shipment.save()
        with self.assertRaises(ValidationError):
            ShipmentService.cancel_shipment(self.shipment)
