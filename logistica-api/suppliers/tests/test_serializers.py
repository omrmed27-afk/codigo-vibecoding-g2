from django.test import TestCase

from suppliers.models import Supplier
from suppliers.serializers import SupplierReadSerializer, SupplierWriteSerializer


def valid_write_data(**kwargs):
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


class SupplierWriteSerializerHappyPathTest(TestCase):

    def test_valid_data_is_valid(self):
        serializer = SupplierWriteSerializer(data=valid_write_data())
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_validated_data_contains_all_fields(self):
        data = valid_write_data()
        serializer = SupplierWriteSerializer(data=data)
        serializer.is_valid()
        for field in ['name', 'contact_name', 'email', 'phone', 'address', 'city', 'country']:
            self.assertIn(field, serializer.validated_data)


class SupplierWriteSerializerUnhappyPathTest(TestCase):

    def test_missing_name_is_invalid(self):
        data = valid_write_data()
        del data['name']
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_missing_contact_name_is_invalid(self):
        data = valid_write_data()
        del data['contact_name']
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('contact_name', serializer.errors)

    def test_missing_email_is_invalid(self):
        data = valid_write_data()
        del data['email']
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_missing_phone_is_invalid(self):
        data = valid_write_data()
        del data['phone']
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('phone', serializer.errors)

    def test_missing_address_is_invalid(self):
        data = valid_write_data()
        del data['address']
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('address', serializer.errors)

    def test_missing_city_is_invalid(self):
        data = valid_write_data()
        del data['city']
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('city', serializer.errors)

    def test_missing_country_is_invalid(self):
        data = valid_write_data()
        del data['country']
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('country', serializer.errors)

    def test_invalid_email_format_is_invalid(self):
        data = valid_write_data(email='not-an-email')
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_duplicate_email_on_create_is_invalid(self):
        Supplier.objects.create(**valid_write_data(email='dup@test.com'))
        data = valid_write_data(email='dup@test.com', name='Another')
        serializer = SupplierWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_duplicate_email_on_update_same_instance_is_valid(self):
        """Updating a supplier with its own email must not trigger uniqueness error."""
        supplier = Supplier.objects.create(**valid_write_data(email='same@test.com'))
        data = valid_write_data(email='same@test.com')
        serializer = SupplierWriteSerializer(instance=supplier, data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_duplicate_email_on_update_different_instance_is_invalid(self):
        Supplier.objects.create(**valid_write_data(email='existing@test.com'))
        other = Supplier.objects.create(**valid_write_data(
            email='other@test.com', name='Other'
        ))
        data = valid_write_data(email='existing@test.com')
        serializer = SupplierWriteSerializer(instance=other, data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)


class SupplierReadSerializerTest(TestCase):

    def setUp(self):
        self.supplier = Supplier.objects.create(**valid_write_data())

    def test_read_serializer_includes_id(self):
        serializer = SupplierReadSerializer(self.supplier)
        self.assertIn('id', serializer.data)
        self.assertEqual(serializer.data['id'], self.supplier.pk)

    def test_read_serializer_includes_created_at(self):
        serializer = SupplierReadSerializer(self.supplier)
        self.assertIn('created_at', serializer.data)
        self.assertIsNotNone(serializer.data['created_at'])

    def test_read_serializer_includes_updated_at(self):
        serializer = SupplierReadSerializer(self.supplier)
        self.assertIn('updated_at', serializer.data)
        self.assertIsNotNone(serializer.data['updated_at'])

    def test_read_serializer_includes_all_expected_fields(self):
        serializer = SupplierReadSerializer(self.supplier)
        expected_fields = ['id', 'name', 'contact_name', 'email', 'phone',
                           'address', 'city', 'country', 'created_at', 'updated_at']
        for field in expected_fields:
            self.assertIn(field, serializer.data)

    def test_write_serializer_does_not_accept_id_as_writable(self):
        """id is read_only in the read serializer; write serializer has no id field."""
        # Use a unique email to avoid conflicts with the supplier created in setUp.
        data = valid_write_data(email='unique_write_test@test.com')
        data['id'] = 9999
        serializer = SupplierWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        # id must not appear in validated_data since SupplierWriteSerializer doesn't define it
        self.assertNotIn('id', serializer.validated_data)
