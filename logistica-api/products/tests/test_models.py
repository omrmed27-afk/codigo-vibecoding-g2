"""
Tests for products.models — Product model definition, constraints, and meta behavior.
"""
from decimal import Decimal

from django.db import IntegrityError
from django.test import TestCase

from suppliers.models import Supplier
from warehouses.models import Warehouse
from products.models import Product


class ProductModelSetupMixin:
    """Shared helper to create FK dependencies."""

    def _make_supplier(self, suffix=''):
        return Supplier.objects.create(
            name=f'Tech Supplier{suffix}',
            contact_name='Jane Doe',
            email=f'supplier{suffix}@test.com',
            phone='123456789',
            address='123 Industrial St',
            city='Bogota',
            country='Colombia',
        )

    def _make_warehouse(self, suffix=''):
        return Warehouse.objects.create(
            name=f'Main Warehouse{suffix}',
            address='456 Storage Ave',
            city='Medellin',
            country='Colombia',
        )

    def _make_product(self, supplier, warehouse, sku='SKU-001'):
        return Product.objects.create(
            name='Laptop Pro',
            description='A powerful laptop',
            sku=sku,
            weight_kg=Decimal('2.500'),
            width_cm=Decimal('35.00'),
            height_cm=Decimal('2.50'),
            depth_cm=Decimal('24.00'),
            unit_price=Decimal('1500.00'),
            stock_quantity=10,
            supplier=supplier,
            warehouse=warehouse,
        )


class ProductCreationTest(ProductModelSetupMixin, TestCase):

    def setUp(self):
        self.supplier = self._make_supplier()
        self.warehouse = self._make_warehouse()

    def test_create_product_all_required_fields(self):
        """Happy path: product creates successfully with all required fields."""
        product = self._make_product(self.supplier, self.warehouse)
        self.assertIsNotNone(product.pk)
        self.assertEqual(product.name, 'Laptop Pro')
        self.assertEqual(product.sku, 'SKU-001')
        self.assertEqual(product.weight_kg, Decimal('2.500'))
        self.assertEqual(product.unit_price, Decimal('1500.00'))
        self.assertEqual(product.supplier, self.supplier)
        self.assertEqual(product.warehouse, self.warehouse)

    def test_stock_quantity_defaults_to_zero(self):
        """stock_quantity defaults to 0 when not provided."""
        product = Product.objects.create(
            name='Tablet Mini',
            sku='TAB-001',
            weight_kg=Decimal('0.600'),
            width_cm=Decimal('20.00'),
            height_cm=Decimal('0.80'),
            depth_cm=Decimal('14.00'),
            unit_price=Decimal('500.00'),
            supplier=self.supplier,
            warehouse=self.warehouse,
        )
        self.assertEqual(product.stock_quantity, 0)

    def test_description_nullable(self):
        """description field accepts None (null=True, blank=True)."""
        product = Product.objects.create(
            name='Headphones',
            sku='HP-001',
            weight_kg=Decimal('0.300'),
            width_cm=Decimal('20.00'),
            height_cm=Decimal('10.00'),
            depth_cm=Decimal('5.00'),
            unit_price=Decimal('200.00'),
            supplier=self.supplier,
            warehouse=self.warehouse,
            description=None,
        )
        self.assertIsNone(product.description)

    def test_str_representation(self):
        """__str__ returns 'name (sku)' format."""
        product = self._make_product(self.supplier, self.warehouse)
        self.assertEqual(str(product), 'Laptop Pro (SKU-001)')

    def test_auto_timestamps(self):
        """created_at and updated_at are set automatically."""
        product = self._make_product(self.supplier, self.warehouse)
        self.assertIsNotNone(product.created_at)
        self.assertIsNotNone(product.updated_at)


class ProductUniquenessTest(ProductModelSetupMixin, TestCase):

    def setUp(self):
        self.supplier = self._make_supplier()
        self.warehouse = self._make_warehouse()

    def test_sku_unique_constraint(self):
        """IntegrityError is raised when two products share the same SKU."""
        self._make_product(self.supplier, self.warehouse, sku='DUPE-SKU')
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                name='Another Product',
                sku='DUPE-SKU',
                weight_kg=Decimal('1.000'),
                width_cm=Decimal('10.00'),
                height_cm=Decimal('5.00'),
                depth_cm=Decimal('8.00'),
                unit_price=Decimal('99.00'),
                supplier=self.supplier,
                warehouse=self.warehouse,
            )

    def test_different_skus_allowed(self):
        """Two products with different SKUs can coexist."""
        p1 = self._make_product(self.supplier, self.warehouse, sku='SKU-A')
        p2 = self._make_product(self.supplier, self.warehouse, sku='SKU-B')
        self.assertNotEqual(p1.sku, p2.sku)


class ProductForeignKeyTest(ProductModelSetupMixin, TestCase):

    def setUp(self):
        self.supplier = self._make_supplier()
        self.warehouse = self._make_warehouse()

    def test_supplier_on_delete_protect(self):
        """Deleting a supplier that has products raises ProtectedError."""
        from django.db.models import ProtectedError
        self._make_product(self.supplier, self.warehouse)
        with self.assertRaises(ProtectedError):
            self.supplier.delete()

    def test_warehouse_on_delete_protect(self):
        """Deleting a warehouse that has products raises ProtectedError."""
        from django.db.models import ProtectedError
        self._make_product(self.supplier, self.warehouse)
        with self.assertRaises(ProtectedError):
            self.warehouse.delete()


class ProductMetaOrderingTest(ProductModelSetupMixin, TestCase):

    def test_meta_ordering_is_minus_created_at(self):
        """Meta.ordering is ['-created_at']."""
        self.assertEqual(Product._meta.ordering, ['-created_at'])
