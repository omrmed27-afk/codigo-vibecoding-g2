"""
Tests for shipments.models — Shipment and ShipmentProduct.

Covers:
- Field defaults and creation
- __str__ representations
- unique constraint on tracking_number
- unique_together on (shipment, product)
- SET_NULL on_delete for transport and route
- CASCADE on_delete: deleting Shipment removes its ShipmentProducts
- PROTECT on_delete: customer and warehouse cannot be deleted while shipment exists
- Nullable fields accept None
"""
import datetime
from decimal import Decimal

from django.db import IntegrityError
from django.test import TestCase
from django.db.models import ProtectedError

from shipments.models import Shipment, ShipmentProduct

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


class ShipmentModelTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()
        self.supplier = make_supplier()
        self.customer = make_customer()
        self.product = make_product(self.supplier, self.warehouse)
        driver_user = make_driver_user()
        self.driver = make_driver(driver_user)
        self.transport = make_transport(self.driver)
        self.route = make_route(self.warehouse)

    # ------------------------------------------------------------------ creation
    def test_create_shipment_with_required_fields(self):
        shipment = make_shipment(self.customer, self.warehouse)
        self.assertIsNotNone(shipment.pk)
        self.assertEqual(shipment.status, Shipment.ShipmentStatus.PENDING)
        self.assertIsNone(shipment.transport)
        self.assertIsNone(shipment.route)
        self.assertIsNone(shipment.actual_delivery_date)
        self.assertIsNone(shipment.calculated_cost)
        self.assertIsNone(shipment.notes)

    def test_shipment_status_default_is_pending(self):
        shipment = make_shipment(self.customer, self.warehouse)
        self.assertEqual(shipment.status, 'pending')

    def test_shipment_str(self):
        shipment = make_shipment(self.customer, self.warehouse)
        expected = f"{shipment.tracking_number} ({shipment.status})"
        self.assertEqual(str(shipment), expected)

    # ------------------------------------------------------------------ constraints
    def test_tracking_number_unique_constraint(self):
        make_shipment(self.customer, self.warehouse, tracking_number='SHIP-UNIQUE-001')
        with self.assertRaises(IntegrityError):
            make_shipment(self.customer, self.warehouse, tracking_number='SHIP-UNIQUE-001')

    # ------------------------------------------------------------------ nullable fields
    def test_transport_nullable(self):
        shipment = make_shipment(self.customer, self.warehouse)
        self.assertIsNone(shipment.transport)

    def test_route_nullable(self):
        shipment = make_shipment(self.customer, self.warehouse)
        self.assertIsNone(shipment.route)

    def test_actual_delivery_date_nullable(self):
        shipment = make_shipment(self.customer, self.warehouse)
        self.assertIsNone(shipment.actual_delivery_date)

    def test_calculated_cost_nullable(self):
        shipment = make_shipment(self.customer, self.warehouse)
        self.assertIsNone(shipment.calculated_cost)

    def test_notes_nullable(self):
        shipment = make_shipment(self.customer, self.warehouse)
        self.assertIsNone(shipment.notes)

    # ------------------------------------------------------------------ SET_NULL on_delete
    def test_delete_transport_sets_null_on_shipment(self):
        shipment = make_shipment(self.customer, self.warehouse)
        shipment.transport = self.transport
        shipment.route = self.route
        shipment.save()
        self.transport.delete()
        shipment.refresh_from_db()
        self.assertIsNone(shipment.transport)

    def test_delete_route_sets_null_on_shipment(self):
        shipment = make_shipment(self.customer, self.warehouse)
        shipment.route = self.route
        shipment.save()
        self.route.delete()
        shipment.refresh_from_db()
        self.assertIsNone(shipment.route)

    # ------------------------------------------------------------------ PROTECT on_delete
    def test_delete_customer_raises_protected_error(self):
        make_shipment(self.customer, self.warehouse)
        with self.assertRaises(ProtectedError):
            self.customer.delete()

    def test_delete_warehouse_raises_protected_error(self):
        make_shipment(self.customer, self.warehouse)
        with self.assertRaises(ProtectedError):
            self.warehouse.delete()

    # ------------------------------------------------------------------ Meta ordering
    def test_meta_ordering_is_by_created_at_desc(self):
        self.assertEqual(Shipment._meta.ordering, ['-created_at'])

    # ------------------------------------------------------------------ choices
    def test_shipment_status_choices_values(self):
        choices_values = [c[0] for c in Shipment.ShipmentStatus.choices]
        self.assertIn('pending', choices_values)
        self.assertIn('picked_up', choices_values)
        self.assertIn('in_transit', choices_values)
        self.assertIn('delivered', choices_values)
        self.assertIn('cancelled', choices_values)

    def test_shipment_with_all_optional_fields(self):
        shipment = Shipment.objects.create(
            tracking_number='SHIP-FULL-001',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Full Address',
            destination_city='Full City',
            destination_country='Full Country',
            scheduled_delivery_date=datetime.date(2026, 7, 1),
            weight_kg=Decimal('3.500'),
            base_cost=Decimal('8.75'),
            transport=self.transport,
            route=self.route,
            actual_delivery_date=datetime.date(2026, 6, 30),
            calculated_cost=Decimal('10.00'),
            notes='Handle with care.',
        )
        self.assertEqual(shipment.transport, self.transport)
        self.assertEqual(shipment.route, self.route)
        self.assertEqual(shipment.notes, 'Handle with care.')
        self.assertEqual(shipment.calculated_cost, Decimal('10.00'))


class ShipmentProductModelTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()
        self.supplier = make_supplier()
        self.customer = make_customer()
        self.product = make_product(self.supplier, self.warehouse)
        self.shipment = make_shipment(self.customer, self.warehouse)

    # ------------------------------------------------------------------ creation
    def test_create_shipment_product(self):
        sp = make_shipment_product(self.shipment, self.product, quantity=3)
        self.assertEqual(sp.quantity, 3)
        self.assertEqual(sp.unit_price_at_shipment, self.product.unit_price)
        self.assertEqual(sp.shipment, self.shipment)
        self.assertEqual(sp.product, self.product)

    def test_shipment_product_str(self):
        sp = make_shipment_product(self.shipment, self.product, quantity=2)
        expected = f"{self.product.name} x2"
        self.assertEqual(str(sp), expected)

    # ------------------------------------------------------------------ constraints
    def test_unique_together_shipment_product(self):
        make_shipment_product(self.shipment, self.product, quantity=1)
        with self.assertRaises(IntegrityError):
            make_shipment_product(self.shipment, self.product, quantity=2)

    # ------------------------------------------------------------------ CASCADE
    def test_delete_shipment_cascades_to_shipment_products(self):
        sp = make_shipment_product(self.shipment, self.product, quantity=1)
        sp_id = sp.pk
        self.shipment.delete()
        self.assertFalse(ShipmentProduct.objects.filter(pk=sp_id).exists())

    # ------------------------------------------------------------------ PROTECT from product
    def test_delete_product_raises_protected_error(self):
        make_shipment_product(self.shipment, self.product, quantity=1)
        with self.assertRaises(ProtectedError):
            self.product.delete()

    # ------------------------------------------------------------------ Meta ordering
    def test_meta_ordering_is_by_id(self):
        self.assertEqual(ShipmentProduct._meta.ordering, ['id'])
