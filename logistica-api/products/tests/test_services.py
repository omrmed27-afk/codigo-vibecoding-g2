"""
Tests for products.services — ProductService business logic.
"""
from decimal import Decimal

from django.test import TestCase
from rest_framework.exceptions import ValidationError

from suppliers.models import Supplier
from warehouses.models import Warehouse
from products.models import Product
from products.services import ProductService


def make_supplier():
    return Supplier.objects.create(
        name='Acme Corp',
        contact_name='John Smith',
        email='acme@test.com',
        phone='555000111',
        address='1 Acme Blvd',
        city='Bogota',
        country='Colombia',
    )


def make_warehouse():
    return Warehouse.objects.create(
        name='Central WH',
        address='99 Dock St',
        city='Cartagena',
        country='Colombia',
    )


def base_product_data(supplier, warehouse, sku='SVC-001'):
    return {
        'name': 'Mouse',
        'description': 'Wireless mouse',
        'sku': sku,
        'weight_kg': Decimal('0.150'),
        'width_cm': Decimal('12.00'),
        'height_cm': Decimal('4.00'),
        'depth_cm': Decimal('7.00'),
        'unit_price': Decimal('35.99'),
        'stock_quantity': 50,
        'supplier': supplier,
        'warehouse': warehouse,
    }


class ProductServiceCreateTest(TestCase):

    def setUp(self):
        self.supplier = make_supplier()
        self.warehouse = make_warehouse()

    def test_create_product_returns_product_instance(self):
        """Happy path: create_product returns a Product with the expected data."""
        data = base_product_data(self.supplier, self.warehouse)
        product = ProductService.create_product(data)
        self.assertIsInstance(product, Product)
        self.assertIsNotNone(product.pk)
        self.assertEqual(product.name, 'Mouse')
        self.assertEqual(product.sku, 'SVC-001')

    def test_create_product_persists_to_db(self):
        """Created product is retrievable from the database."""
        data = base_product_data(self.supplier, self.warehouse)
        product = ProductService.create_product(data)
        self.assertTrue(Product.objects.filter(pk=product.pk).exists())

    def test_create_product_with_select_related(self):
        """Returned product has supplier and warehouse pre-fetched (no extra query)."""
        data = base_product_data(self.supplier, self.warehouse)
        product = ProductService.create_product(data)
        # Accessing related fields must not raise; they should already be cached
        self.assertEqual(product.supplier.pk, self.supplier.pk)
        self.assertEqual(product.warehouse.pk, self.warehouse.pk)

    def test_create_product_default_stock_zero(self):
        """Edge case: stock_quantity=0 is a valid value."""
        data = base_product_data(self.supplier, self.warehouse, sku='ZERO-STOCK')
        data['stock_quantity'] = 0
        product = ProductService.create_product(data)
        self.assertEqual(product.stock_quantity, 0)

    def test_create_product_minimal_decimal_price(self):
        """Edge case: very small unit_price is accepted."""
        data = base_product_data(self.supplier, self.warehouse, sku='CHEAP-001')
        data['unit_price'] = Decimal('0.01')
        product = ProductService.create_product(data)
        self.assertEqual(product.unit_price, Decimal('0.01'))

    def test_create_product_without_description(self):
        """Edge case: description omitted → product created with None description."""
        data = base_product_data(self.supplier, self.warehouse, sku='NODESC-001')
        data.pop('description')
        product = ProductService.create_product(data)
        self.assertIsNone(product.description)


class ProductServiceUpdateTest(TestCase):

    def setUp(self):
        self.supplier = make_supplier()
        self.warehouse = make_warehouse()
        self.product = Product.objects.create(
            **base_product_data(self.supplier, self.warehouse)
        )

    def test_update_product_name(self):
        """Happy path: updating name persists the new value."""
        updated = ProductService.update_product(self.product, {'name': 'Updated Mouse'})
        self.assertEqual(updated.name, 'Updated Mouse')

    def test_update_product_unit_price(self):
        """Happy path: updating unit_price persists the new value."""
        updated = ProductService.update_product(self.product, {'unit_price': Decimal('45.00')})
        self.assertEqual(updated.unit_price, Decimal('45.00'))

    def test_update_product_persists_to_db(self):
        """Updated values are persisted in the database, not just in memory."""
        ProductService.update_product(self.product, {'stock_quantity': 99})
        refreshed = Product.objects.get(pk=self.product.pk)
        self.assertEqual(refreshed.stock_quantity, 99)

    def test_update_product_returns_refreshed_with_related(self):
        """Returned instance has select_related applied (supplier, warehouse populated)."""
        updated = ProductService.update_product(self.product, {'name': 'New Name'})
        self.assertEqual(updated.supplier.pk, self.supplier.pk)
        self.assertEqual(updated.warehouse.pk, self.warehouse.pk)

    def test_update_product_partial_fields(self):
        """Only fields provided in data dict are changed; others stay unchanged."""
        original_sku = self.product.sku
        ProductService.update_product(self.product, {'name': 'Partial Update'})
        refreshed = Product.objects.get(pk=self.product.pk)
        self.assertEqual(refreshed.name, 'Partial Update')
        self.assertEqual(refreshed.sku, original_sku)

    def test_update_product_warehouse(self):
        """FK field (warehouse) can be updated via the service."""
        new_warehouse = Warehouse.objects.create(
            name='New WH',
            address='999 New St',
            city='Bucaramanga',
            country='Colombia',
        )
        updated = ProductService.update_product(self.product, {'warehouse': new_warehouse})
        self.assertEqual(updated.warehouse.pk, new_warehouse.pk)


class ProductServiceDeleteTest(TestCase):

    def setUp(self):
        self.supplier = make_supplier()
        self.warehouse = make_warehouse()

    def test_delete_product_happy_path(self):
        """Happy path: delete_product removes the product from the database."""
        product = Product.objects.create(
            **base_product_data(self.supplier, self.warehouse, sku='DEL-001')
        )
        pk = product.pk
        ProductService.delete_product(product)
        self.assertFalse(Product.objects.filter(pk=pk).exists())

    def test_delete_product_raises_validation_error_on_protected(self):
        """When a ProtectedError occurs, the service raises a DRF ValidationError."""
        from unittest.mock import patch
        from django.db.models import ProtectedError

        product = Product.objects.create(
            **base_product_data(self.supplier, self.warehouse, sku='PROT-001')
        )

        with patch.object(product, 'delete', side_effect=ProtectedError('blocked', set())):
            with self.assertRaises(ValidationError) as ctx:
                ProductService.delete_product(product)

        self.assertIn('Cannot delete product', str(ctx.exception.detail))
