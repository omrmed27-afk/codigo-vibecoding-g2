from django.test import TestCase
from django.core.exceptions import ValidationError
from decimal import Decimal
from warehouses.models import Warehouse
from warehouses.services import WarehouseService


class WarehouseServiceCreateTest(TestCase):
    """Tests for WarehouseService.create_warehouse."""

    def _base_data(self, **overrides):
        data = {
            'name': 'Service WH',
            'address': 'Calle Servicio 10',
            'city': 'Bogota',
            'country': 'Colombia',
        }
        data.update(overrides)
        return data

    def test_create_warehouse_returns_warehouse_instance(self):
        """create_warehouse returns a Warehouse instance."""
        warehouse = WarehouseService.create_warehouse(self._base_data())
        self.assertIsInstance(warehouse, Warehouse)

    def test_create_warehouse_persists_to_db(self):
        """create_warehouse saves the warehouse to the database."""
        WarehouseService.create_warehouse(self._base_data())
        self.assertEqual(Warehouse.objects.count(), 1)

    def test_create_warehouse_correct_name(self):
        """create_warehouse stores the correct name."""
        warehouse = WarehouseService.create_warehouse(self._base_data(name='Custom Name'))
        self.assertEqual(warehouse.name, 'Custom Name')

    def test_create_warehouse_with_coordinates(self):
        """create_warehouse stores latitude and longitude correctly."""
        data = self._base_data(
            latitude=Decimal('4.711000'),
            longitude=Decimal('-74.072100'),
        )
        warehouse = WarehouseService.create_warehouse(data)
        self.assertEqual(warehouse.latitude, Decimal('4.711000'))
        self.assertEqual(warehouse.longitude, Decimal('-74.072100'))

    def test_create_warehouse_default_is_active_true(self):
        """create_warehouse defaults is_active to True when not provided."""
        warehouse = WarehouseService.create_warehouse(self._base_data())
        self.assertTrue(warehouse.is_active)

    def test_create_warehouse_with_is_active_false(self):
        """create_warehouse respects is_active=False."""
        data = self._base_data(is_active=False)
        warehouse = WarehouseService.create_warehouse(data)
        self.assertFalse(warehouse.is_active)

    def test_create_warehouse_assigns_pk(self):
        """create_warehouse sets a non-None pk on the returned instance."""
        warehouse = WarehouseService.create_warehouse(self._base_data())
        self.assertIsNotNone(warehouse.pk)


class WarehouseServiceUpdateTest(TestCase):
    """Tests for WarehouseService.update_warehouse."""

    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Original Name',
            address='Original Address',
            city='Bogota',
            country='Colombia',
        )

    def test_update_warehouse_returns_warehouse_instance(self):
        """update_warehouse returns a Warehouse instance."""
        result = WarehouseService.update_warehouse(self.warehouse, {'name': 'Updated Name'})
        self.assertIsInstance(result, Warehouse)

    def test_update_warehouse_changes_name(self):
        """update_warehouse changes the name field."""
        WarehouseService.update_warehouse(self.warehouse, {'name': 'New Name'})
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.name, 'New Name')

    def test_update_warehouse_changes_city(self):
        """update_warehouse changes the city field."""
        WarehouseService.update_warehouse(self.warehouse, {'city': 'Medellin'})
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.city, 'Medellin')

    def test_update_warehouse_changes_is_active(self):
        """update_warehouse can deactivate a warehouse."""
        WarehouseService.update_warehouse(self.warehouse, {'is_active': False})
        self.warehouse.refresh_from_db()
        self.assertFalse(self.warehouse.is_active)

    def test_update_warehouse_adds_coordinates(self):
        """update_warehouse can add coordinates to a warehouse that had none."""
        WarehouseService.update_warehouse(
            self.warehouse,
            {'latitude': Decimal('6.250000'), 'longitude': Decimal('-75.563600')},
        )
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.latitude, Decimal('6.250000'))

    def test_update_warehouse_persists_unchanged_fields(self):
        """update_warehouse does not change fields that are not in the update data."""
        WarehouseService.update_warehouse(self.warehouse, {'city': 'Cali'})
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.name, 'Original Name')
        self.assertEqual(self.warehouse.address, 'Original Address')

    def test_update_warehouse_partial_update(self):
        """update_warehouse updates only the supplied fields."""
        WarehouseService.update_warehouse(self.warehouse, {'name': 'Partial Update'})
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.name, 'Partial Update')
        self.assertEqual(self.warehouse.country, 'Colombia')


class WarehouseServiceDeleteTest(TestCase):
    """Tests for WarehouseService.delete_warehouse."""

    def test_delete_warehouse_removes_from_db(self):
        """delete_warehouse removes the warehouse from the database."""
        warehouse = Warehouse.objects.create(
            name='To Delete',
            address='Delete Addr',
            city='Bogota',
            country='Colombia',
        )
        self.assertEqual(Warehouse.objects.count(), 1)
        WarehouseService.delete_warehouse(warehouse)
        self.assertEqual(Warehouse.objects.count(), 0)

    def test_delete_warehouse_with_protected_reference_raises_validation_error(self):
        """delete_warehouse raises ValidationError when warehouse has protected references.

        This test simulates a PROTECT constraint by creating a product that
        references the warehouse. Since products app is installed, this verifies
        the ProtectedError is caught and re-raised as ValidationError.
        """
        from products.models import Product
        from suppliers.models import Supplier

        supplier = Supplier.objects.create(
            name='Tech Supplier',
            contact_name='John Doe',
            email='john@techsupplier.com',
            phone='+57300000000',
            address='Supplier St 1',
            city='Bogota',
            country='Colombia',
        )
        warehouse = Warehouse.objects.create(
            name='Protected WH',
            address='Protected Addr',
            city='Bogota',
            country='Colombia',
        )
        Product.objects.create(
            name='Laptop',
            sku='LAP-001',
            weight_kg=Decimal('2.500'),
            width_cm=Decimal('35.00'),
            height_cm=Decimal('2.50'),
            depth_cm=Decimal('25.00'),
            unit_price=Decimal('1500.00'),
            stock_quantity=10,
            supplier=supplier,
            warehouse=warehouse,
        )

        with self.assertRaises(ValidationError):
            WarehouseService.delete_warehouse(warehouse)
