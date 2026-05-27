"""
Tests for shipments.serializers.

Covers:
- ShipmentWriteSerializer: happy path, missing required fields, invalid types,
  empty products list, duplicate products
- ShipmentProductWriteSerializer: valid data, quantity < 1
- ShipmentReadSerializer: output includes nested objects
"""
import datetime
from decimal import Decimal

from django.test import TestCase

from shipments.serializers import (
    ShipmentWriteSerializer,
    ShipmentReadSerializer,
    ShipmentProductWriteSerializer,
)

from .fixtures import (
    make_warehouse,
    make_supplier,
    make_customer,
    make_product,
    make_shipment,
)


class ShipmentWriteSerializerTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()
        self.supplier = make_supplier()
        self.customer = make_customer()
        self.product = make_product(self.supplier, self.warehouse)
        self.valid_data = {
            'customer': self.customer.pk,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': '100 Main St',
            'destination_city': 'Bogota',
            'destination_country': 'Colombia',
            'scheduled_delivery_date': '2026-07-01',
            'weight_kg': '5.000',
            'products': [
                {'product': self.product.pk, 'quantity': 2},
            ],
        }

    # ------------------------------------------------------------------ happy path
    def test_valid_data_is_valid(self):
        serializer = ShipmentWriteSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_notes_optional_defaults_to_none(self):
        serializer = ShipmentWriteSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertIsNone(serializer.validated_data['notes'])

    def test_notes_can_be_provided(self):
        data = {**self.valid_data, 'notes': 'Fragile items'}
        serializer = ShipmentWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['notes'], 'Fragile items')

    # ------------------------------------------------------------------ required fields
    def test_missing_customer_is_invalid(self):
        data = {**self.valid_data}
        del data['customer']
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('customer', serializer.errors)

    def test_missing_origin_warehouse_is_invalid(self):
        data = {**self.valid_data}
        del data['origin_warehouse']
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('origin_warehouse', serializer.errors)

    def test_missing_destination_address_is_invalid(self):
        data = {**self.valid_data}
        del data['destination_address']
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('destination_address', serializer.errors)

    def test_missing_destination_city_is_invalid(self):
        data = {**self.valid_data}
        del data['destination_city']
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('destination_city', serializer.errors)

    def test_missing_destination_country_is_invalid(self):
        data = {**self.valid_data}
        del data['destination_country']
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('destination_country', serializer.errors)

    def test_missing_scheduled_delivery_date_is_invalid(self):
        data = {**self.valid_data}
        del data['scheduled_delivery_date']
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('scheduled_delivery_date', serializer.errors)

    def test_missing_weight_kg_is_invalid(self):
        data = {**self.valid_data}
        del data['weight_kg']
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('weight_kg', serializer.errors)

    def test_missing_products_is_invalid(self):
        data = {**self.valid_data}
        del data['products']
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('products', serializer.errors)

    # ------------------------------------------------------------------ invalid types
    def test_invalid_customer_pk_is_invalid(self):
        data = {**self.valid_data, 'customer': 99999}
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('customer', serializer.errors)

    def test_invalid_warehouse_pk_is_invalid(self):
        data = {**self.valid_data, 'origin_warehouse': 99999}
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('origin_warehouse', serializer.errors)

    def test_non_numeric_weight_kg_is_invalid(self):
        data = {**self.valid_data, 'weight_kg': 'not-a-number'}
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('weight_kg', serializer.errors)

    def test_invalid_date_format_is_invalid(self):
        data = {**self.valid_data, 'scheduled_delivery_date': 'not-a-date'}
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('scheduled_delivery_date', serializer.errors)

    # ------------------------------------------------------------------ products validation
    def test_empty_products_list_is_invalid(self):
        data = {**self.valid_data, 'products': []}
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('products', serializer.errors)

    def test_duplicate_products_in_list_is_invalid(self):
        data = {
            **self.valid_data,
            'products': [
                {'product': self.product.pk, 'quantity': 1},
                {'product': self.product.pk, 'quantity': 2},
            ],
        }
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('products', serializer.errors)

    def test_product_with_invalid_pk_is_invalid(self):
        data = {**self.valid_data, 'products': [{'product': 99999, 'quantity': 1}]}
        serializer = ShipmentWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_multiple_different_products_valid(self):
        product2 = make_product(
            self.supplier, self.warehouse, sku='MOUSE-002',
            name='Mouse', unit_price=Decimal('25.00'),
            weight_kg=Decimal('0.200'),
        )
        data = {
            **self.valid_data,
            'products': [
                {'product': self.product.pk, 'quantity': 1},
                {'product': product2.pk, 'quantity': 3},
            ],
        }
        serializer = ShipmentWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)


class ShipmentProductWriteSerializerTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()
        self.supplier = make_supplier()
        self.product = make_product(self.supplier, self.warehouse)

    def test_valid_product_and_quantity(self):
        serializer = ShipmentProductWriteSerializer(
            data={'product': self.product.pk, 'quantity': 5}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_quantity_zero_is_invalid(self):
        serializer = ShipmentProductWriteSerializer(
            data={'product': self.product.pk, 'quantity': 0}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('quantity', serializer.errors)

    def test_quantity_negative_is_invalid(self):
        serializer = ShipmentProductWriteSerializer(
            data={'product': self.product.pk, 'quantity': -1}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('quantity', serializer.errors)

    def test_missing_product_is_invalid(self):
        serializer = ShipmentProductWriteSerializer(data={'quantity': 1})
        self.assertFalse(serializer.is_valid())
        self.assertIn('product', serializer.errors)

    def test_missing_quantity_is_invalid(self):
        serializer = ShipmentProductWriteSerializer(data={'product': self.product.pk})
        self.assertFalse(serializer.is_valid())
        self.assertIn('quantity', serializer.errors)


class ShipmentReadSerializerTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()
        self.supplier = make_supplier()
        self.customer = make_customer()
        self.product = make_product(self.supplier, self.warehouse)
        self.shipment = make_shipment(self.customer, self.warehouse)

    def test_read_serializer_includes_customer_object(self):
        serializer = ShipmentReadSerializer(self.shipment)
        data = serializer.data
        self.assertIn('customer', data)
        self.assertEqual(data['customer']['id'], self.customer.pk)
        self.assertEqual(data['customer']['name'], self.customer.name)

    def test_read_serializer_includes_origin_warehouse_object(self):
        serializer = ShipmentReadSerializer(self.shipment)
        data = serializer.data
        self.assertIn('origin_warehouse', data)
        self.assertEqual(data['origin_warehouse']['id'], self.warehouse.pk)

    def test_read_serializer_transport_is_null_when_unassigned(self):
        serializer = ShipmentReadSerializer(self.shipment)
        data = serializer.data
        self.assertIsNone(data['transport'])

    def test_read_serializer_route_is_null_when_unassigned(self):
        serializer = ShipmentReadSerializer(self.shipment)
        data = serializer.data
        self.assertIsNone(data['route'])

    def test_read_serializer_tracking_number_is_read_only(self):
        """tracking_number should appear in output but not be writable via ReadSerializer."""
        serializer = ShipmentReadSerializer(self.shipment)
        data = serializer.data
        self.assertIn('tracking_number', data)
        self.assertEqual(data['tracking_number'], self.shipment.tracking_number)

    def test_read_serializer_shipment_products_list(self):
        from .fixtures import make_shipment_product
        make_shipment_product(self.shipment, self.product, quantity=2)
        # Re-fetch with prefetch to satisfy the nested serializer
        from shipments.models import Shipment
        shipment = (
            Shipment.objects
            .select_related('customer', 'origin_warehouse', 'transport', 'route')
            .prefetch_related('shipment_products__product')
            .get(pk=self.shipment.pk)
        )
        serializer = ShipmentReadSerializer(shipment)
        data = serializer.data
        self.assertEqual(len(data['shipment_products']), 1)
        self.assertEqual(data['shipment_products'][0]['quantity'], 2)
        self.assertEqual(data['shipment_products'][0]['product']['sku'], self.product.sku)
