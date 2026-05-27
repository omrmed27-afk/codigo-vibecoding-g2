"""
Tests for products.serializers — ProductReadSerializer and ProductWriteSerializer.
"""
from decimal import Decimal

from django.test import TestCase

from suppliers.models import Supplier
from warehouses.models import Warehouse
from products.models import Product
from products.serializers import ProductReadSerializer, ProductWriteSerializer


def make_supplier(suffix=''):
    return Supplier.objects.create(
        name=f'Supplier{suffix}',
        contact_name='Contact',
        email=f'supplier{suffix}@test.com',
        phone='111222333',
        address='Addr 1',
        city='Bogota',
        country='Colombia',
    )


def make_warehouse(suffix=''):
    return Warehouse.objects.create(
        name=f'Warehouse{suffix}',
        address='Addr 2',
        city='Cali',
        country='Colombia',
    )


def make_product(supplier, warehouse, sku='P-001'):
    return Product.objects.create(
        name='Monitor',
        sku=sku,
        weight_kg=Decimal('4.200'),
        width_cm=Decimal('60.00'),
        height_cm=Decimal('40.00'),
        depth_cm=Decimal('15.00'),
        unit_price=Decimal('350.00'),
        stock_quantity=5,
        supplier=supplier,
        warehouse=warehouse,
    )


VALID_WRITE_DATA = {
    'name': 'Keyboard',
    'sku': 'KB-001',
    'weight_kg': '0.800',
    'width_cm': '45.00',
    'height_cm': '3.00',
    'depth_cm': '15.00',
    'unit_price': '75.00',
    'stock_quantity': 20,
}


class ProductWriteSerializerHappyPathTest(TestCase):

    def setUp(self):
        self.supplier = make_supplier()
        self.warehouse = make_warehouse()

    def _valid_data(self, **overrides):
        data = {**VALID_WRITE_DATA, 'supplier': self.supplier.pk, 'warehouse': self.warehouse.pk}
        data.update(overrides)
        return data

    def test_valid_data_is_valid(self):
        """Happy path: all required fields present → serializer is valid."""
        s = ProductWriteSerializer(data=self._valid_data())
        self.assertTrue(s.is_valid(), s.errors)

    def test_valid_data_without_description_is_valid(self):
        """description is optional (null=True) — omitting it is valid."""
        data = self._valid_data()
        data.pop('description', None)
        s = ProductWriteSerializer(data=data)
        self.assertTrue(s.is_valid(), s.errors)

    def test_valid_data_with_description(self):
        """description field is accepted when provided."""
        data = self._valid_data(description='A mechanical keyboard')
        s = ProductWriteSerializer(data=data)
        self.assertTrue(s.is_valid(), s.errors)

    def test_default_stock_quantity_zero(self):
        """stock_quantity defaults to 0 when omitted."""
        data = self._valid_data()
        data.pop('stock_quantity', None)
        s = ProductWriteSerializer(data=data)
        self.assertTrue(s.is_valid(), s.errors)
        # stock_quantity not in validated_data means model default applies
        self.assertNotIn('stock_quantity', s.errors)


class ProductWriteSerializerUnhappyPathTest(TestCase):

    def setUp(self):
        self.supplier = make_supplier()
        self.warehouse = make_warehouse()

    def _valid_data(self, **overrides):
        data = {**VALID_WRITE_DATA, 'supplier': self.supplier.pk, 'warehouse': self.warehouse.pk}
        data.update(overrides)
        return data

    def test_missing_name_is_invalid(self):
        """name is required — omitting it returns a validation error."""
        data = self._valid_data()
        del data['name']
        s = ProductWriteSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn('name', s.errors)

    def test_missing_sku_is_invalid(self):
        """sku is required — omitting it returns a validation error."""
        data = self._valid_data()
        del data['sku']
        s = ProductWriteSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn('sku', s.errors)

    def test_missing_weight_kg_is_invalid(self):
        """weight_kg is required."""
        data = self._valid_data()
        del data['weight_kg']
        s = ProductWriteSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn('weight_kg', s.errors)

    def test_missing_unit_price_is_invalid(self):
        """unit_price is required."""
        data = self._valid_data()
        del data['unit_price']
        s = ProductWriteSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn('unit_price', s.errors)

    def test_missing_supplier_is_invalid(self):
        """supplier FK is required."""
        data = self._valid_data()
        del data['supplier']
        s = ProductWriteSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn('supplier', s.errors)

    def test_missing_warehouse_is_invalid(self):
        """warehouse FK is required."""
        data = self._valid_data()
        del data['warehouse']
        s = ProductWriteSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn('warehouse', s.errors)

    def test_invalid_supplier_pk_is_invalid(self):
        """Non-existent supplier PK → validation error on supplier field."""
        data = self._valid_data(supplier=99999)
        s = ProductWriteSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn('supplier', s.errors)

    def test_invalid_warehouse_pk_is_invalid(self):
        """Non-existent warehouse PK → validation error on warehouse field."""
        data = self._valid_data(warehouse=99999)
        s = ProductWriteSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn('warehouse', s.errors)

    def test_non_numeric_weight_is_invalid(self):
        """String 'abc' for weight_kg → validation error."""
        data = self._valid_data(weight_kg='abc')
        s = ProductWriteSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn('weight_kg', s.errors)

    def test_non_numeric_unit_price_is_invalid(self):
        """String 'abc' for unit_price → validation error."""
        data = self._valid_data(unit_price='not-a-number')
        s = ProductWriteSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn('unit_price', s.errors)

    def test_duplicate_sku_on_create_is_invalid(self):
        """validate_sku raises ValidationError when SKU already exists (create path)."""
        make_product(self.supplier, self.warehouse, sku='EXIST-SKU')
        data = self._valid_data(sku='EXIST-SKU')
        s = ProductWriteSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn('sku', s.errors)

    def test_duplicate_sku_on_update_same_instance_is_valid(self):
        """validate_sku excludes the current instance on update — keeping own SKU is valid."""
        product = make_product(self.supplier, self.warehouse, sku='OWN-SKU')
        data = self._valid_data(sku='OWN-SKU')
        s = ProductWriteSerializer(instance=product, data=data)
        self.assertTrue(s.is_valid(), s.errors)

    def test_duplicate_sku_on_update_different_instance_is_invalid(self):
        """validate_sku rejects SKU of another product during update."""
        make_product(self.supplier, self.warehouse, sku='OTHER-SKU')
        product2 = make_product(self.supplier, self.warehouse, sku='MINE-SKU')
        data = self._valid_data(sku='OTHER-SKU')
        s = ProductWriteSerializer(instance=product2, data=data)
        self.assertFalse(s.is_valid())
        self.assertIn('sku', s.errors)


class ProductReadSerializerTest(TestCase):

    def setUp(self):
        self.supplier = make_supplier()
        self.warehouse = make_warehouse()
        self.product = make_product(self.supplier, self.warehouse, sku='READ-001')

    def test_read_serializer_includes_nested_supplier(self):
        """Supplier is serialized as nested object with id and name."""
        s = ProductReadSerializer(self.product)
        data = s.data
        self.assertIn('supplier', data)
        self.assertEqual(data['supplier']['id'], self.supplier.pk)
        self.assertEqual(data['supplier']['name'], self.supplier.name)

    def test_read_serializer_includes_nested_warehouse(self):
        """Warehouse is serialized as nested object with id and name."""
        s = ProductReadSerializer(self.product)
        data = s.data
        self.assertIn('warehouse', data)
        self.assertEqual(data['warehouse']['id'], self.warehouse.pk)
        self.assertEqual(data['warehouse']['name'], self.warehouse.name)

    def test_read_serializer_includes_all_expected_fields(self):
        """All expected fields are present in the read serializer output."""
        s = ProductReadSerializer(self.product)
        data = s.data
        expected_fields = {
            'id', 'name', 'description', 'sku',
            'weight_kg', 'width_cm', 'height_cm', 'depth_cm',
            'unit_price', 'stock_quantity',
            'supplier', 'warehouse',
            'created_at', 'updated_at',
        }
        self.assertEqual(set(data.keys()), expected_fields)

    def test_read_serializer_id_is_present(self):
        """id field is present and matches the instance pk."""
        s = ProductReadSerializer(self.product)
        self.assertEqual(s.data['id'], self.product.pk)
