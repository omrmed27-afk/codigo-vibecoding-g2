from django.test import TestCase
from django.db import IntegrityError

from customers.models import Customer


class CustomerModelCreationTest(TestCase):
    """Tests for successful Customer model creation."""

    def setUp(self):
        self.valid_data = {
            'name': 'Acme Corp',
            'customer_type': Customer.CustomerType.COMPANY,
            'email': 'acme@example.com',
            'phone': '+573001234567',
            'address': 'Calle 100 # 10-20',
            'city': 'Bogota',
            'country': 'Colombia',
        }

    def test_create_customer_with_required_fields(self):
        customer = Customer.objects.create(**self.valid_data)
        self.assertEqual(customer.name, 'Acme Corp')
        self.assertEqual(customer.customer_type, 'company')
        self.assertEqual(customer.email, 'acme@example.com')
        self.assertEqual(customer.phone, '+573001234567')
        self.assertEqual(customer.address, 'Calle 100 # 10-20')
        self.assertEqual(customer.city, 'Bogota')
        self.assertEqual(customer.country, 'Colombia')
        self.assertIsNone(customer.tax_id)

    def test_create_individual_customer(self):
        self.valid_data['customer_type'] = Customer.CustomerType.INDIVIDUAL
        self.valid_data['email'] = 'john@example.com'
        customer = Customer.objects.create(**self.valid_data)
        self.assertEqual(customer.customer_type, 'individual')

    def test_create_customer_with_tax_id(self):
        self.valid_data['tax_id'] = '900123456-7'
        customer = Customer.objects.create(**self.valid_data)
        self.assertEqual(customer.tax_id, '900123456-7')

    def test_tax_id_defaults_to_none(self):
        customer = Customer.objects.create(**self.valid_data)
        self.assertIsNone(customer.tax_id)

    def test_created_at_set_automatically(self):
        customer = Customer.objects.create(**self.valid_data)
        self.assertIsNotNone(customer.created_at)

    def test_updated_at_set_automatically(self):
        customer = Customer.objects.create(**self.valid_data)
        self.assertIsNotNone(customer.updated_at)

    def test_id_auto_assigned(self):
        customer = Customer.objects.create(**self.valid_data)
        self.assertIsNotNone(customer.id)
        self.assertIsInstance(customer.id, int)


class CustomerModelStrTest(TestCase):
    """Tests for Customer.__str__."""

    def test_str_returns_name(self):
        customer = Customer.objects.create(
            name='Tech Solutions',
            customer_type='company',
            email='tech@example.com',
            phone='3001112233',
            address='Carrera 7 # 32-10',
            city='Medellin',
            country='Colombia',
        )
        self.assertEqual(str(customer), 'Tech Solutions')


class CustomerModelConstraintsTest(TestCase):
    """Tests for unique constraints and nullable fields."""

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

    def test_duplicate_email_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Customer.objects.create(
                name='Another Corp',
                customer_type='company',
                email='original@example.com',  # duplicate
                phone='3009999999',
                address='Calle 5 # 1-1',
                city='Cali',
                country='Colombia',
            )

    def test_duplicate_tax_id_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Customer.objects.create(
                name='Another Corp',
                customer_type='company',
                email='another@example.com',
                phone='3009999999',
                address='Calle 5 # 1-1',
                city='Cali',
                country='Colombia',
                tax_id='800111222-1',  # duplicate
            )

    def test_tax_id_null_is_allowed(self):
        customer = Customer.objects.create(
            name='No Tax Corp',
            customer_type='individual',
            email='notax@example.com',
            phone='3002223333',
            address='Carrera 3 # 4-5',
            city='Barranquilla',
            country='Colombia',
            tax_id=None,
        )
        self.assertIsNone(customer.tax_id)

    def test_two_customers_with_null_tax_id_allowed(self):
        """Multiple customers can have tax_id=None (UNIQUE NULL is not violated in SQLite/Postgres).
        setUp creates a customer with tax_id='800111222-1' (not null), so only the two
        created here have null tax_id.
        """
        Customer.objects.create(
            name='Customer A',
            customer_type='individual',
            email='a@example.com',
            phone='3001111111',
            address='Calle A',
            city='Bogota',
            country='Colombia',
            tax_id=None,
        )
        Customer.objects.create(
            name='Customer B',
            customer_type='individual',
            email='b@example.com',
            phone='3002222222',
            address='Calle B',
            city='Bogota',
            country='Colombia',
            tax_id=None,
        )
        self.assertEqual(Customer.objects.filter(tax_id__isnull=True).count(), 2)

    def test_meta_ordering_is_by_created_at_descending(self):
        """Meta.ordering is [-created_at] — verify the field directly."""
        self.assertEqual(Customer._meta.ordering, ['-created_at'])
