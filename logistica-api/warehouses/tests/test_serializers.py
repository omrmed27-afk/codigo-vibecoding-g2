from django.test import TestCase
from decimal import Decimal
from warehouses.models import Warehouse
from warehouses.serializers import WarehouseReadSerializer, WarehouseWriteSerializer


class WarehouseWriteSerializerValidTest(TestCase):
    """Happy path tests for WarehouseWriteSerializer."""

    def _valid_data(self, **overrides):
        data = {
            'name': 'Test Warehouse',
            'address': 'Calle 1 # 2-3',
            'city': 'Bogota',
            'country': 'Colombia',
        }
        data.update(overrides)
        return data

    def test_valid_minimal_data(self):
        """Serializer is valid with only required fields."""
        serializer = WarehouseWriteSerializer(data=self._valid_data())
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_with_coordinates(self):
        """Serializer is valid when both latitude and longitude are provided."""
        data = self._valid_data(latitude='4.711000', longitude='-74.072100')
        serializer = WarehouseWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_with_is_active_false(self):
        """Serializer accepts is_active=False."""
        data = self._valid_data(is_active=False)
        serializer = WarehouseWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_boundary_latitude_90(self):
        """Latitude at boundary value 90 is valid."""
        data = self._valid_data(latitude='90', longitude='0')
        serializer = WarehouseWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_boundary_latitude_minus_90(self):
        """Latitude at boundary value -90 is valid."""
        data = self._valid_data(latitude='-90', longitude='0')
        serializer = WarehouseWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_boundary_longitude_180(self):
        """Longitude at boundary value 180 is valid."""
        data = self._valid_data(latitude='0', longitude='180')
        serializer = WarehouseWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_boundary_longitude_minus_180(self):
        """Longitude at boundary value -180 is valid."""
        data = self._valid_data(latitude='0', longitude='-180')
        serializer = WarehouseWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_null_coordinates(self):
        """Serializer is valid when latitude and longitude are both omitted."""
        data = self._valid_data()
        serializer = WarehouseWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)


class WarehouseWriteSerializerInvalidTest(TestCase):
    """Unhappy path tests for WarehouseWriteSerializer."""

    def _valid_data(self, **overrides):
        data = {
            'name': 'Test Warehouse',
            'address': 'Calle 1 # 2-3',
            'city': 'Bogota',
            'country': 'Colombia',
        }
        data.update(overrides)
        return data

    def test_missing_name_is_invalid(self):
        """Serializer is invalid when name is missing."""
        data = {
            'address': 'Calle 1 # 2-3',
            'city': 'Bogota',
            'country': 'Colombia',
        }
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_missing_address_is_invalid(self):
        """Serializer is invalid when address is missing."""
        data = {
            'name': 'Test WH',
            'city': 'Bogota',
            'country': 'Colombia',
        }
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('address', serializer.errors)

    def test_missing_city_is_invalid(self):
        """Serializer is invalid when city is missing."""
        data = {
            'name': 'Test WH',
            'address': 'Calle 1',
            'country': 'Colombia',
        }
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('city', serializer.errors)

    def test_missing_country_is_invalid(self):
        """Serializer is invalid when country is missing."""
        data = {
            'name': 'Test WH',
            'address': 'Calle 1',
            'city': 'Bogota',
        }
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('country', serializer.errors)

    def test_latitude_above_90_is_invalid(self):
        """Latitude above 90 fails field-level validation."""
        data = self._valid_data(latitude='91', longitude='0')
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('latitude', serializer.errors)

    def test_latitude_below_minus_90_is_invalid(self):
        """Latitude below -90 fails field-level validation."""
        data = self._valid_data(latitude='-91', longitude='0')
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('latitude', serializer.errors)

    def test_longitude_above_180_is_invalid(self):
        """Longitude above 180 fails field-level validation."""
        data = self._valid_data(latitude='0', longitude='181')
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('longitude', serializer.errors)

    def test_longitude_below_minus_180_is_invalid(self):
        """Longitude below -180 fails field-level validation."""
        data = self._valid_data(latitude='0', longitude='-181')
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('longitude', serializer.errors)

    def test_latitude_without_longitude_is_invalid(self):
        """Providing latitude without longitude fails cross-field validation."""
        data = self._valid_data(latitude='4.711')
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('longitude', serializer.errors)

    def test_longitude_without_latitude_is_invalid(self):
        """Providing longitude without latitude fails cross-field validation."""
        data = self._valid_data(longitude='-74.072')
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('latitude', serializer.errors)

    def test_latitude_not_a_number_is_invalid(self):
        """Non-numeric latitude fails validation."""
        data = self._valid_data(latitude='not-a-number', longitude='0')
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('latitude', serializer.errors)

    def test_longitude_not_a_number_is_invalid(self):
        """Non-numeric longitude fails validation."""
        data = self._valid_data(latitude='0', longitude='not-a-number')
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('longitude', serializer.errors)

    def test_name_blank_is_invalid(self):
        """Empty string for name fails validation."""
        data = self._valid_data(name='')
        serializer = WarehouseWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)


class WarehouseReadSerializerTest(TestCase):
    """Tests for WarehouseReadSerializer output."""

    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Read WH',
            address='Av. Lectura 1',
            city='Bogota',
            country='Colombia',
            latitude=Decimal('4.600000'),
            longitude=Decimal('-74.080000'),
        )

    def test_read_serializer_includes_all_expected_fields(self):
        """Read serializer exposes all expected fields."""
        serializer = WarehouseReadSerializer(self.warehouse)
        data = serializer.data
        expected_fields = {
            'id', 'name', 'address', 'city', 'country',
            'latitude', 'longitude', 'is_active', 'created_at', 'updated_at',
        }
        self.assertEqual(set(data.keys()), expected_fields)

    def test_read_serializer_returns_correct_values(self):
        """Read serializer returns the correct field values."""
        serializer = WarehouseReadSerializer(self.warehouse)
        data = serializer.data
        self.assertEqual(data['name'], 'Read WH')
        self.assertEqual(data['city'], 'Bogota')
        self.assertEqual(data['country'], 'Colombia')
        self.assertTrue(data['is_active'])

    def test_read_serializer_created_at_is_read_only(self):
        """created_at is read-only in the read serializer."""
        field = WarehouseReadSerializer().fields['created_at']
        self.assertTrue(field.read_only)

    def test_read_serializer_updated_at_is_read_only(self):
        """updated_at is read-only in the read serializer."""
        field = WarehouseReadSerializer().fields['updated_at']
        self.assertTrue(field.read_only)

    def test_write_serializer_does_not_expose_id(self):
        """Write serializer does not expose id (it is not in fields)."""
        write_fields = set(WarehouseWriteSerializer.Meta.fields)
        self.assertNotIn('id', write_fields)

    def test_write_serializer_does_not_expose_created_at(self):
        """Write serializer does not expose created_at."""
        write_fields = set(WarehouseWriteSerializer.Meta.fields)
        self.assertNotIn('created_at', write_fields)

    def test_write_serializer_does_not_expose_updated_at(self):
        """Write serializer does not expose updated_at."""
        write_fields = set(WarehouseWriteSerializer.Meta.fields)
        self.assertNotIn('updated_at', write_fields)
