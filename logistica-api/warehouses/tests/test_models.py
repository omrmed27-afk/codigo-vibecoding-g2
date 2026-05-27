from django.test import TestCase
from decimal import Decimal
from warehouses.models import Warehouse


class WarehouseModelCreationTest(TestCase):
    """Tests for Warehouse model creation and field defaults."""

    def test_create_warehouse_with_required_fields(self):
        """Creating a warehouse with all required fields succeeds."""
        warehouse = Warehouse.objects.create(
            name='Main Warehouse',
            address='Calle 123 # 45-67',
            city='Bogota',
            country='Colombia',
        )
        self.assertIsNotNone(warehouse.pk)
        self.assertEqual(warehouse.name, 'Main Warehouse')
        self.assertEqual(warehouse.address, 'Calle 123 # 45-67')
        self.assertEqual(warehouse.city, 'Bogota')
        self.assertEqual(warehouse.country, 'Colombia')

    def test_is_active_defaults_to_true(self):
        """is_active field defaults to True when not provided."""
        warehouse = Warehouse.objects.create(
            name='Warehouse A',
            address='Av. Principal 1',
            city='Medellin',
            country='Colombia',
        )
        self.assertTrue(warehouse.is_active)

    def test_latitude_defaults_to_none(self):
        """latitude defaults to None when not provided."""
        warehouse = Warehouse.objects.create(
            name='Warehouse B',
            address='Carrera 10 # 20-30',
            city='Cali',
            country='Colombia',
        )
        self.assertIsNone(warehouse.latitude)

    def test_longitude_defaults_to_none(self):
        """longitude defaults to None when not provided."""
        warehouse = Warehouse.objects.create(
            name='Warehouse C',
            address='Transversal 5 # 8-12',
            city='Barranquilla',
            country='Colombia',
        )
        self.assertIsNone(warehouse.longitude)

    def test_create_warehouse_with_coordinates(self):
        """Creating a warehouse with latitude and longitude succeeds."""
        warehouse = Warehouse.objects.create(
            name='Geo Warehouse',
            address='Calle 50 # 10-20',
            city='Bogota',
            country='Colombia',
            latitude=Decimal('4.711000'),
            longitude=Decimal('-74.072100'),
        )
        self.assertEqual(warehouse.latitude, Decimal('4.711000'))
        self.assertEqual(warehouse.longitude, Decimal('-74.072100'))

    def test_create_warehouse_with_is_active_false(self):
        """Creating a warehouse with is_active=False persists correctly."""
        warehouse = Warehouse.objects.create(
            name='Inactive Warehouse',
            address='Zona Industrial 99',
            city='Bucaramanga',
            country='Colombia',
            is_active=False,
        )
        self.assertFalse(warehouse.is_active)

    def test_created_at_auto_populated(self):
        """created_at is automatically set on creation."""
        warehouse = Warehouse.objects.create(
            name='Timestamp WH',
            address='Calle Test 1',
            city='Bogota',
            country='Colombia',
        )
        self.assertIsNotNone(warehouse.created_at)

    def test_updated_at_auto_populated(self):
        """updated_at is automatically set on creation."""
        warehouse = Warehouse.objects.create(
            name='Update WH',
            address='Calle Test 2',
            city='Bogota',
            country='Colombia',
        )
        self.assertIsNotNone(warehouse.updated_at)


class WarehouseModelStrTest(TestCase):
    """Tests for Warehouse __str__ method."""

    def test_str_returns_name(self):
        """__str__ returns the warehouse name."""
        warehouse = Warehouse(name='Central Depot')
        self.assertEqual(str(warehouse), 'Central Depot')


class WarehouseModelMetaTest(TestCase):
    """Tests for Warehouse Meta options."""

    def test_default_ordering_is_minus_created_at(self):
        """Default ordering is by -created_at (most recent first)."""
        self.assertEqual(Warehouse._meta.ordering, ['-created_at'])

    def test_verbose_name(self):
        self.assertEqual(Warehouse._meta.verbose_name, 'Warehouse')

    def test_verbose_name_plural(self):
        self.assertEqual(Warehouse._meta.verbose_name_plural, 'Warehouses')

    def test_ordering_most_recent_first(self):
        """Queryset ordering is set to -created_at (most recent first).

        SQLite timestamps can have identical values when records are created
        in the same tick, so we verify the ordering field declaration rather
        than relying on insertion timing.
        """
        ordering = Warehouse._meta.ordering
        self.assertEqual(ordering, ['-created_at'])


class WarehouseModelNullableFieldsTest(TestCase):
    """Tests confirming null/blank behavior on optional fields."""

    def test_latitude_accepts_none(self):
        """latitude field accepts NULL."""
        warehouse = Warehouse.objects.create(
            name='No Coords WH',
            address='Calle Nula 0',
            city='Bogota',
            country='Colombia',
            latitude=None,
        )
        self.assertIsNone(warehouse.latitude)

    def test_longitude_accepts_none(self):
        """longitude field accepts NULL."""
        warehouse = Warehouse.objects.create(
            name='No Coords WH 2',
            address='Calle Nula 1',
            city='Bogota',
            country='Colombia',
            longitude=None,
        )
        self.assertIsNone(warehouse.longitude)

    def test_extreme_valid_latitude(self):
        """latitude accepts boundary values -90 and 90."""
        wh_north = Warehouse.objects.create(
            name='North Pole WH',
            address='Pole Addr',
            city='Arctic',
            country='International',
            latitude=Decimal('90.000000'),
            longitude=Decimal('0.000000'),
        )
        self.assertEqual(wh_north.latitude, Decimal('90.000000'))

        wh_south = Warehouse.objects.create(
            name='South Pole WH',
            address='Pole Addr S',
            city='Antarctic',
            country='International',
            latitude=Decimal('-90.000000'),
            longitude=Decimal('0.000000'),
        )
        self.assertEqual(wh_south.latitude, Decimal('-90.000000'))
