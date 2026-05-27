from decimal import Decimal

from django.test import TestCase
from rest_framework.exceptions import ValidationError

from suppliers.models import Supplier
from suppliers.services import SupplierService
from products.models import Product
from warehouses.models import Warehouse


def supplier_data(**kwargs):
    defaults = {
        'name': 'Tech Supplier S.A.',
        'contact_name': 'Juan Perez',
        'email': 'contact@techsupplier.com',
        'phone': '+573001234567',
        'address': 'Calle 123 #45-67',
        'city': 'Bogota',
        'country': 'Colombia',
    }
    defaults.update(kwargs)
    return defaults


class SupplierServiceCreateTest(TestCase):

    def test_create_supplier_returns_supplier_instance(self):
        supplier = SupplierService.create_supplier(supplier_data())
        self.assertIsInstance(supplier, Supplier)

    def test_create_supplier_persists_to_db(self):
        supplier = SupplierService.create_supplier(supplier_data())
        self.assertEqual(Supplier.objects.count(), 1)
        self.assertEqual(Supplier.objects.get(pk=supplier.pk).name, 'Tech Supplier S.A.')

    def test_create_supplier_sets_correct_field_values(self):
        data = supplier_data()
        supplier = SupplierService.create_supplier(data)
        for field, value in data.items():
            self.assertEqual(getattr(supplier, field), value)

    def test_create_supplier_sets_timestamps(self):
        supplier = SupplierService.create_supplier(supplier_data())
        self.assertIsNotNone(supplier.created_at)
        self.assertIsNotNone(supplier.updated_at)


class SupplierServiceUpdateTest(TestCase):

    def setUp(self):
        self.supplier = SupplierService.create_supplier(supplier_data())

    def test_update_supplier_returns_supplier_instance(self):
        result = SupplierService.update_supplier(self.supplier, {'name': 'Updated Name'})
        self.assertIsInstance(result, Supplier)

    def test_update_supplier_modifies_field_in_db(self):
        SupplierService.update_supplier(self.supplier, {'name': 'Updated Name'})
        refreshed = Supplier.objects.get(pk=self.supplier.pk)
        self.assertEqual(refreshed.name, 'Updated Name')

    def test_update_supplier_partial_update_preserves_other_fields(self):
        original_email = self.supplier.email
        SupplierService.update_supplier(self.supplier, {'name': 'New Name'})
        refreshed = Supplier.objects.get(pk=self.supplier.pk)
        self.assertEqual(refreshed.email, original_email)

    def test_update_supplier_can_update_email(self):
        SupplierService.update_supplier(self.supplier, {'email': 'newemail@test.com'})
        refreshed = Supplier.objects.get(pk=self.supplier.pk)
        self.assertEqual(refreshed.email, 'newemail@test.com')

    def test_update_supplier_multiple_fields(self):
        updates = {'name': 'New Name', 'city': 'Medellin', 'country': 'Colombia'}
        SupplierService.update_supplier(self.supplier, updates)
        refreshed = Supplier.objects.get(pk=self.supplier.pk)
        self.assertEqual(refreshed.name, 'New Name')
        self.assertEqual(refreshed.city, 'Medellin')


class SupplierServiceDeleteTest(TestCase):

    def test_delete_supplier_without_products_succeeds(self):
        supplier = SupplierService.create_supplier(supplier_data())
        pk = supplier.pk
        SupplierService.delete_supplier(supplier)
        self.assertFalse(Supplier.objects.filter(pk=pk).exists())

    def test_delete_supplier_with_products_raises_drf_validation_error(self):
        """
        When a supplier has associated products, ProtectedError is raised by Django ORM.
        The service catches it and re-raises as DRF ValidationError (→ HTTP 400).
        """
        supplier = SupplierService.create_supplier(supplier_data())
        warehouse = Warehouse.objects.create(
            name='Main WH',
            address='Calle 1',
            city='Bogota',
            country='Colombia',
        )
        Product.objects.create(
            name='Laptop',
            sku='LAP-001',
            weight_kg=Decimal('1.500'),
            width_cm=Decimal('30.00'),
            height_cm=Decimal('2.00'),
            depth_cm=Decimal('20.00'),
            unit_price=Decimal('1500.00'),
            stock_quantity=5,
            supplier=supplier,
            warehouse=warehouse,
        )
        with self.assertRaises(ValidationError):
            SupplierService.delete_supplier(supplier)

    def test_delete_supplier_with_products_error_message(self):
        """The re-raised ValidationError carries a descriptive message."""
        supplier = SupplierService.create_supplier(supplier_data())
        warehouse = Warehouse.objects.create(
            name='WH2',
            address='Calle 2',
            city='Cali',
            country='Colombia',
        )
        Product.objects.create(
            name='Monitor',
            sku='MON-001',
            weight_kg=Decimal('3.000'),
            width_cm=Decimal('50.00'),
            height_cm=Decimal('30.00'),
            depth_cm=Decimal('10.00'),
            unit_price=Decimal('500.00'),
            stock_quantity=2,
            supplier=supplier,
            warehouse=warehouse,
        )
        try:
            SupplierService.delete_supplier(supplier)
            self.fail('Expected ValidationError was not raised')
        except ValidationError as exc:
            error_str = str(exc.detail)
            self.assertIn('Cannot delete supplier', error_str)
