from django.test import TestCase

from customers.models import Customer
from customers.serializers import CustomerReadSerializer, CustomerWriteSerializer


class CustomerWriteSerializerValidTest(TestCase):
    """Happy path tests for CustomerWriteSerializer."""

    def setUp(self):
        self.valid_data = {
            'name': 'Acme Corp',
            'customer_type': 'company',
            'email': 'acme@example.com',
            'phone': '+573001234567',
            'address': 'Calle 100 # 10-20',
            'city': 'Bogota',
            'country': 'Colombia',
        }

    def test_valid_data_is_valid(self):
        serializer = CustomerWriteSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_data_with_tax_id(self):
        self.valid_data['tax_id'] = '900123456-7'
        serializer = CustomerWriteSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_tax_id_optional(self):
        """tax_id can be omitted — it is null=True, blank=True."""
        serializer = CustomerWriteSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_individual_customer_type_valid(self):
        self.valid_data['customer_type'] = 'individual'
        serializer = CustomerWriteSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)


class CustomerWriteSerializerInvalidTest(TestCase):
    """Unhappy path tests for CustomerWriteSerializer."""

    def setUp(self):
        self.valid_data = {
            'name': 'Acme Corp',
            'customer_type': 'company',
            'email': 'acme@example.com',
            'phone': '+573001234567',
            'address': 'Calle 100 # 10-20',
            'city': 'Bogota',
            'country': 'Colombia',
        }

    def test_missing_name_is_invalid(self):
        data = {k: v for k, v in self.valid_data.items() if k != 'name'}
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_missing_customer_type_is_invalid(self):
        data = {k: v for k, v in self.valid_data.items() if k != 'customer_type'}
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('customer_type', serializer.errors)

    def test_missing_email_is_invalid(self):
        data = {k: v for k, v in self.valid_data.items() if k != 'email'}
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_missing_phone_is_invalid(self):
        data = {k: v for k, v in self.valid_data.items() if k != 'phone'}
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('phone', serializer.errors)

    def test_missing_address_is_invalid(self):
        data = {k: v for k, v in self.valid_data.items() if k != 'address'}
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('address', serializer.errors)

    def test_missing_city_is_invalid(self):
        data = {k: v for k, v in self.valid_data.items() if k != 'city'}
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('city', serializer.errors)

    def test_missing_country_is_invalid(self):
        data = {k: v for k, v in self.valid_data.items() if k != 'country'}
        serializer = CustomerWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('country', serializer.errors)

    def test_invalid_email_format_is_invalid(self):
        self.valid_data['email'] = 'not-an-email'
        serializer = CustomerWriteSerializer(data=self.valid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_invalid_customer_type_choice_is_invalid(self):
        self.valid_data['customer_type'] = 'corporation'  # not a valid choice
        serializer = CustomerWriteSerializer(data=self.valid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('customer_type', serializer.errors)

    def test_duplicate_email_fails_validation(self):
        """validate_email raises ValidationError if email is already taken."""
        Customer.objects.create(
            name='Existing Corp',
            customer_type='company',
            email='acme@example.com',
            phone='3009999999',
            address='Somewhere',
            city='Bogota',
            country='Colombia',
        )
        serializer = CustomerWriteSerializer(data=self.valid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_duplicate_tax_id_fails_validation(self):
        """validate_tax_id raises ValidationError if tax_id is already taken."""
        Customer.objects.create(
            name='Existing Corp',
            customer_type='company',
            email='existing@example.com',
            phone='3009999999',
            address='Somewhere',
            city='Bogota',
            country='Colombia',
            tax_id='900123456-7',
        )
        self.valid_data['tax_id'] = '900123456-7'
        serializer = CustomerWriteSerializer(data=self.valid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('tax_id', serializer.errors)


class CustomerWriteSerializerUpdateTest(TestCase):
    """Tests for update scenario (instance provided) in CustomerWriteSerializer."""

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Original Corp',
            customer_type='company',
            email='original@example.com',
            phone='3001234567',
            address='Avenida 1 # 2-3',
            city='Cali',
            country='Colombia',
            tax_id='800111222-1',
        )

    def test_update_with_same_email_is_valid(self):
        """On update, the same email for the same instance should not fail uniqueness."""
        data = {
            'name': 'Updated Corp',
            'customer_type': 'company',
            'email': 'original@example.com',  # same email, same instance
            'phone': '3001234567',
            'address': 'Avenida 1 # 2-3',
            'city': 'Cali',
            'country': 'Colombia',
        }
        serializer = CustomerWriteSerializer(instance=self.customer, data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_update_with_same_tax_id_is_valid(self):
        """On update, the same tax_id for the same instance should not fail uniqueness."""
        data = {
            'name': 'Updated Corp',
            'customer_type': 'company',
            'email': 'original@example.com',
            'phone': '3001234567',
            'address': 'Avenida 1 # 2-3',
            'city': 'Cali',
            'country': 'Colombia',
            'tax_id': '800111222-1',  # same tax_id, same instance
        }
        serializer = CustomerWriteSerializer(instance=self.customer, data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_update_with_another_customers_email_fails(self):
        """On update, using a different customer's email must fail."""
        other = Customer.objects.create(
            name='Other Corp',
            customer_type='company',
            email='other@example.com',
            phone='3009876543',
            address='Carrera 5',
            city='Bogota',
            country='Colombia',
        )
        data = {
            'name': 'Updated Corp',
            'customer_type': 'company',
            'email': 'other@example.com',  # belongs to 'other'
            'phone': '3001234567',
            'address': 'Avenida 1 # 2-3',
            'city': 'Cali',
            'country': 'Colombia',
        }
        serializer = CustomerWriteSerializer(instance=self.customer, data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)


class CustomerReadSerializerTest(TestCase):
    """Tests for CustomerReadSerializer output."""

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Read Corp',
            customer_type='company',
            email='read@example.com',
            phone='3001234567',
            address='Calle 10 # 5-5',
            city='Bogota',
            country='Colombia',
            tax_id='900-111',
        )

    def test_read_serializer_contains_expected_fields(self):
        serializer = CustomerReadSerializer(instance=self.customer)
        data = serializer.data
        expected_fields = ['id', 'name', 'customer_type', 'email', 'phone',
                           'address', 'city', 'country', 'tax_id',
                           'created_at', 'updated_at']
        for field in expected_fields:
            self.assertIn(field, data)

    def test_read_serializer_id_is_read_only(self):
        """id should appear in output and be read-only."""
        serializer = CustomerReadSerializer(instance=self.customer)
        self.assertEqual(serializer.data['id'], self.customer.id)

    def test_read_serializer_created_at_present(self):
        serializer = CustomerReadSerializer(instance=self.customer)
        self.assertIsNotNone(serializer.data['created_at'])

    def test_read_serializer_updated_at_present(self):
        serializer = CustomerReadSerializer(instance=self.customer)
        self.assertIsNotNone(serializer.data['updated_at'])

    def test_write_serializer_does_not_expose_id(self):
        """CustomerWriteSerializer must not include id — it is write-only."""
        serializer = CustomerWriteSerializer(instance=self.customer)
        self.assertNotIn('id', serializer.fields)

    def test_write_serializer_does_not_expose_created_at(self):
        serializer = CustomerWriteSerializer(instance=self.customer)
        self.assertNotIn('created_at', serializer.fields)

    def test_write_serializer_does_not_expose_updated_at(self):
        serializer = CustomerWriteSerializer(instance=self.customer)
        self.assertNotIn('updated_at', serializer.fields)
