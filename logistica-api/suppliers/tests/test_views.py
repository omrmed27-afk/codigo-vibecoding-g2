from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from suppliers.models import Supplier
from products.models import Product
from warehouses.models import Warehouse


BASE_URL = '/api/suppliers/'


def supplier_payload(**kwargs):
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


def create_supplier(**kwargs):
    return Supplier.objects.create(**supplier_payload(**kwargs))


class SupplierListTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)

    def test_list_returns_200(self):
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_empty_returns_empty_results(self):
        response = self.client.get(BASE_URL)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['results'], [])

    def test_list_returns_paginated_results(self):
        create_supplier(email='s1@test.com', name='Supplier 1')
        create_supplier(email='s2@test.com', name='Supplier 2')
        response = self.client.get(BASE_URL)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual(len(response.data['results']), 2)

    def test_list_result_includes_expected_fields(self):
        create_supplier()
        response = self.client.get(BASE_URL)
        result = response.data['results'][0]
        for field in ['id', 'name', 'contact_name', 'email', 'phone',
                      'address', 'city', 'country', 'created_at', 'updated_at']:
            self.assertIn(field, result)

    def test_list_unauthenticated_returns_401(self):
        client = APIClient()
        response = client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SupplierCreateTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)

    def test_create_supplier_returns_201(self):
        response = self.client.post(BASE_URL, supplier_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_supplier_persists_to_db(self):
        self.client.post(BASE_URL, supplier_payload(), format='json')
        self.assertEqual(Supplier.objects.count(), 1)

    def test_create_supplier_response_contains_id(self):
        response = self.client.post(BASE_URL, supplier_payload(), format='json')
        self.assertIn('id', response.data)
        self.assertIsNotNone(response.data['id'])

    def test_create_supplier_response_contains_correct_name(self):
        response = self.client.post(BASE_URL, supplier_payload(), format='json')
        self.assertEqual(response.data['name'], 'Tech Supplier S.A.')

    def test_create_supplier_response_includes_timestamps(self):
        response = self.client.post(BASE_URL, supplier_payload(), format='json')
        self.assertIn('created_at', response.data)
        self.assertIn('updated_at', response.data)

    def test_create_missing_name_returns_400(self):
        data = supplier_payload()
        del data['name']
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_email_returns_400(self):
        data = supplier_payload()
        del data['email']
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invalid_email_format_returns_400(self):
        data = supplier_payload(email='not-valid-email')
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_email_returns_400(self):
        create_supplier(email='dup@test.com')
        data = supplier_payload(email='dup@test.com', name='Another')
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_phone_returns_400(self):
        data = supplier_payload()
        del data['phone']
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_contact_name_returns_400(self):
        data = supplier_payload()
        del data['contact_name']
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_unauthenticated_returns_401(self):
        client = APIClient()
        response = client.post(BASE_URL, supplier_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_error_response_has_error_key(self):
        data = supplier_payload()
        del data['name']
        response = self.client.post(BASE_URL, data, format='json')
        self.assertIn('error', response.data)


class SupplierRetrieveTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.supplier = create_supplier()

    def test_retrieve_existing_supplier_returns_200(self):
        response = self.client.get(f'{BASE_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_supplier(self):
        response = self.client.get(f'{BASE_URL}{self.supplier.pk}/')
        self.assertEqual(response.data['id'], self.supplier.pk)
        self.assertEqual(response.data['email'], self.supplier.email)

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get(f'{BASE_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unauthenticated_returns_401(self):
        client = APIClient()
        response = client.get(f'{BASE_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SupplierUpdateTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.supplier = create_supplier()

    def test_full_update_returns_200(self):
        data = supplier_payload(name='Updated Name', email='updated@test.com')
        response = self.client.put(f'{BASE_URL}{self.supplier.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_full_update_modifies_name_in_db(self):
        data = supplier_payload(name='Updated Name', email='updated@test.com')
        self.client.put(f'{BASE_URL}{self.supplier.pk}/', data, format='json')
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.name, 'Updated Name')

    def test_full_update_response_uses_read_serializer(self):
        data = supplier_payload(name='Updated Name', email='updated@test.com')
        response = self.client.put(f'{BASE_URL}{self.supplier.pk}/', data, format='json')
        self.assertIn('id', response.data)
        self.assertIn('created_at', response.data)

    def test_partial_update_returns_200(self):
        response = self.client.patch(
            f'{BASE_URL}{self.supplier.pk}/', {'name': 'Patched Name'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_partial_update_modifies_only_target_field(self):
        original_email = self.supplier.email
        self.client.patch(
            f'{BASE_URL}{self.supplier.pk}/', {'name': 'Patched Name'}, format='json'
        )
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.name, 'Patched Name')
        self.assertEqual(self.supplier.email, original_email)

    def test_update_with_own_email_does_not_trigger_uniqueness_error(self):
        """PUT with the same email the supplier already has must succeed."""
        data = supplier_payload(name='Same Email Update', email=self.supplier.email)
        response = self.client.put(f'{BASE_URL}{self.supplier.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_with_duplicate_email_of_another_supplier_returns_400(self):
        other = create_supplier(email='other@test.com', name='Other')
        data = supplier_payload(email=other.email)
        response = self.client.put(f'{BASE_URL}{self.supplier.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_nonexistent_returns_404(self):
        data = supplier_payload()
        response = self.client.put(f'{BASE_URL}99999/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_unauthenticated_returns_401(self):
        client = APIClient()
        data = supplier_payload(email='x@test.com')
        response = client.put(f'{BASE_URL}{self.supplier.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SupplierDeleteTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.supplier = create_supplier()

    def test_delete_existing_supplier_returns_204(self):
        response = self.client.delete(f'{BASE_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_supplier_from_db(self):
        pk = self.supplier.pk
        self.client.delete(f'{BASE_URL}{self.supplier.pk}/')
        self.assertFalse(Supplier.objects.filter(pk=pk).exists())

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete(f'{BASE_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated_returns_401(self):
        client = APIClient()
        response = client.delete(f'{BASE_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_supplier_with_products_returns_400(self):
        """
        Supplier referenced by products has PROTECT on_delete.
        Service catches ProtectedError and raises DRF ValidationError → 400.
        """
        warehouse = Warehouse.objects.create(
            name='Test WH',
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
            supplier=self.supplier,
            warehouse=warehouse,
        )
        response = self.client.delete(f'{BASE_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_supplier_with_products_error_response_has_error_key(self):
        warehouse = Warehouse.objects.create(
            name='Test WH 2',
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
            supplier=self.supplier,
            warehouse=warehouse,
        )
        response = self.client.delete(f'{BASE_URL}{self.supplier.pk}/')
        self.assertIn('error', response.data)
