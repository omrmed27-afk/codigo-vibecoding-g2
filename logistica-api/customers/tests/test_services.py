from django.test import TestCase
from rest_framework.exceptions import ValidationError

from customers.models import Customer
from customers.services import CustomerService


class CustomerServiceCreateTest(TestCase):
    """Tests for CustomerService.create_customer."""

    def setUp(self):
        self.valid_data = {
            'name': 'Service Corp',
            'customer_type': 'company',
            'email': 'service@example.com',
            'phone': '3001234567',
            'address': 'Calle 1 # 2-3',
            'city': 'Bogota',
            'country': 'Colombia',
        }

    def test_create_customer_returns_customer_instance(self):
        customer = CustomerService.create_customer(self.valid_data)
        self.assertIsInstance(customer, Customer)

    def test_create_customer_persists_to_db(self):
        CustomerService.create_customer(self.valid_data)
        self.assertEqual(Customer.objects.count(), 1)

    def test_create_customer_fields_match_input(self):
        customer = CustomerService.create_customer(self.valid_data)
        self.assertEqual(customer.name, 'Service Corp')
        self.assertEqual(customer.customer_type, 'company')
        self.assertEqual(customer.email, 'service@example.com')
        self.assertEqual(customer.phone, '3001234567')
        self.assertEqual(customer.city, 'Bogota')
        self.assertEqual(customer.country, 'Colombia')

    def test_create_customer_with_tax_id(self):
        self.valid_data['tax_id'] = '900-111-222'
        customer = CustomerService.create_customer(self.valid_data)
        self.assertEqual(customer.tax_id, '900-111-222')

    def test_create_customer_without_tax_id_defaults_none(self):
        customer = CustomerService.create_customer(self.valid_data)
        self.assertIsNone(customer.tax_id)

    def test_create_individual_customer(self):
        self.valid_data['customer_type'] = 'individual'
        customer = CustomerService.create_customer(self.valid_data)
        self.assertEqual(customer.customer_type, 'individual')


class CustomerServiceUpdateTest(TestCase):
    """Tests for CustomerService.update_customer."""

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Original Corp',
            customer_type='company',
            email='original@example.com',
            phone='3001234567',
            address='Avenida 1 # 2-3',
            city='Cali',
            country='Colombia',
        )

    def test_update_customer_returns_customer_instance(self):
        result = CustomerService.update_customer(self.customer, {'name': 'New Name'})
        self.assertIsInstance(result, Customer)

    def test_update_customer_changes_name(self):
        updated = CustomerService.update_customer(self.customer, {'name': 'Updated Corp'})
        self.assertEqual(updated.name, 'Updated Corp')

    def test_update_customer_persists_to_db(self):
        CustomerService.update_customer(self.customer, {'city': 'Medellin'})
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.city, 'Medellin')

    def test_update_customer_multiple_fields(self):
        data = {'name': 'New Name', 'phone': '3009999999', 'city': 'Cartagena'}
        updated = CustomerService.update_customer(self.customer, data)
        self.assertEqual(updated.name, 'New Name')
        self.assertEqual(updated.phone, '3009999999')
        self.assertEqual(updated.city, 'Cartagena')

    def test_update_customer_does_not_change_unmentioned_fields(self):
        original_email = self.customer.email
        CustomerService.update_customer(self.customer, {'name': 'New Name'})
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.email, original_email)

    def test_update_customer_sets_tax_id(self):
        updated = CustomerService.update_customer(self.customer, {'tax_id': '999-000'})
        self.assertEqual(updated.tax_id, '999-000')


class CustomerServiceDeleteTest(TestCase):
    """Tests for CustomerService.delete_customer."""

    def setUp(self):
        self.customer = Customer.objects.create(
            name='Delete Corp',
            customer_type='company',
            email='delete@example.com',
            phone='3001234567',
            address='Calle 5 # 1-1',
            city='Bogota',
            country='Colombia',
        )

    def test_delete_customer_removes_from_db(self):
        customer_id = self.customer.id
        CustomerService.delete_customer(self.customer)
        self.assertFalse(Customer.objects.filter(pk=customer_id).exists())

    def test_delete_customer_returns_none(self):
        result = CustomerService.delete_customer(self.customer)
        self.assertIsNone(result)

    def test_delete_customer_with_protected_error_raises_validation_error(self):
        """
        When a ProtectedError occurs (customer has shipments), the service
        raises rest_framework.exceptions.ValidationError.
        We simulate this by patching instance.delete to raise ProtectedError.
        """
        from unittest.mock import patch
        from django.db.models import ProtectedError

        with patch.object(self.customer, 'delete', side_effect=ProtectedError('protected', set())):
            with self.assertRaises(ValidationError) as ctx:
                CustomerService.delete_customer(self.customer)
        self.assertIn('associated shipments', str(ctx.exception.detail))
