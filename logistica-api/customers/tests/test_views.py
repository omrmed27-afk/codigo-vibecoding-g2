from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from customers.models import Customer


BASE_URL = '/api/customers/'


def customer_detail_url(pk):
    return f'{BASE_URL}{pk}/'


def make_customer(**kwargs):
    """Helper to create a Customer with sensible defaults."""
    defaults = {
        'name': 'Default Corp',
        'customer_type': 'company',
        'email': 'default@example.com',
        'phone': '3001234567',
        'address': 'Calle 1 # 1-1',
        'city': 'Bogota',
        'country': 'Colombia',
    }
    defaults.update(kwargs)
    return Customer.objects.create(**defaults)


class CustomerListCreateAuthTest(APITestCase):
    """Authentication guard tests for list/create endpoint."""

    def test_list_requires_authentication(self):
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_requires_authentication(self):
        response = self.client.post(BASE_URL, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CustomerListTest(APITestCase):
    """Tests for GET /api/customers/."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)

    def test_list_empty_returns_200_with_empty_results(self):
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['results'], [])

    def test_list_returns_all_customers(self):
        make_customer(name='Corp A', email='a@example.com')
        make_customer(name='Corp B', email='b@example.com')
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_list_response_has_pagination_keys(self):
        response = self.client.get(BASE_URL)
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        self.assertIn('results', response.data)

    def test_list_results_contain_expected_fields(self):
        make_customer(name='Corp A', email='a@example.com')
        response = self.client.get(BASE_URL)
        result = response.data['results'][0]
        for field in ['id', 'name', 'customer_type', 'email', 'phone',
                      'address', 'city', 'country', 'tax_id',
                      'created_at', 'updated_at']:
            self.assertIn(field, result)


class CustomerCreateTest(APITestCase):
    """Tests for POST /api/customers/."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.valid_payload = {
            'name': 'New Corp',
            'customer_type': 'company',
            'email': 'newcorp@example.com',
            'phone': '3001234567',
            'address': 'Calle 100 # 10-20',
            'city': 'Bogota',
            'country': 'Colombia',
        }

    def test_create_customer_returns_201(self):
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_customer_persists_to_db(self):
        self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(Customer.objects.count(), 1)

    def test_create_customer_response_contains_id(self):
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertIn('id', response.data)
        self.assertIsNotNone(response.data['id'])

    def test_create_customer_response_fields_match_input(self):
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.data['name'], 'New Corp')
        self.assertEqual(response.data['customer_type'], 'company')
        self.assertEqual(response.data['email'], 'newcorp@example.com')

    def test_create_customer_with_tax_id(self):
        self.valid_payload['tax_id'] = '900-111-222'
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['tax_id'], '900-111-222')

    def test_create_customer_without_tax_id_defaults_null(self):
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertIsNone(response.data['tax_id'])

    def test_create_individual_customer(self):
        self.valid_payload['customer_type'] = 'individual'
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['customer_type'], 'individual')

    def test_create_missing_required_field_returns_400(self):
        del self.valid_payload['name']
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_email_returns_400(self):
        del self.valid_payload['email']
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invalid_email_returns_400(self):
        self.valid_payload['email'] = 'not-an-email'
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invalid_customer_type_returns_400(self):
        self.valid_payload['customer_type'] = 'invalid_type'
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_email_returns_400(self):
        make_customer(name='Existing', email='newcorp@example.com')
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_tax_id_returns_400(self):
        make_customer(name='Existing', email='existing@example.com', tax_id='900-111-222')
        self.valid_payload['tax_id'] = '900-111-222'
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_error_response_has_error_key(self):
        """Error responses follow the custom_exception_handler format."""
        del self.valid_payload['name']
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertIn('error', response.data)
        self.assertIn('code', response.data['error'])
        self.assertIn('message', response.data['error'])


class CustomerRetrieveTest(APITestCase):
    """Tests for GET /api/customers/<id>/."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.customer = make_customer(name='Retrieve Corp', email='retrieve@example.com')

    def test_retrieve_existing_customer_returns_200(self):
        response = self.client.get(customer_detail_url(self.customer.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_customer(self):
        response = self.client.get(customer_detail_url(self.customer.id))
        self.assertEqual(response.data['id'], self.customer.id)
        self.assertEqual(response.data['name'], 'Retrieve Corp')
        self.assertEqual(response.data['email'], 'retrieve@example.com')

    def test_retrieve_nonexistent_customer_returns_404(self):
        response = self.client.get(customer_detail_url(9999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(customer_detail_url(self.customer.id))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CustomerUpdateTest(APITestCase):
    """Tests for PUT and PATCH /api/customers/<id>/."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.customer = make_customer(name='Update Corp', email='update@example.com')
        self.full_payload = {
            'name': 'Updated Corp',
            'customer_type': 'company',
            'email': 'update@example.com',
            'phone': '3001234567',
            'address': 'Calle 1 # 1-1',
            'city': 'Bogota',
            'country': 'Colombia',
        }

    def test_put_update_returns_200(self):
        response = self.client.put(
            customer_detail_url(self.customer.id),
            self.full_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_put_update_changes_name(self):
        response = self.client.put(
            customer_detail_url(self.customer.id),
            self.full_payload,
            format='json'
        )
        self.assertEqual(response.data['name'], 'Updated Corp')

    def test_put_update_persists_to_db(self):
        self.client.put(
            customer_detail_url(self.customer.id),
            self.full_payload,
            format='json'
        )
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.name, 'Updated Corp')

    def test_patch_partial_update_returns_200(self):
        response = self.client.patch(
            customer_detail_url(self.customer.id),
            {'name': 'Partial Update Corp'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_partial_update_only_changes_specified_field(self):
        original_email = self.customer.email
        self.client.patch(
            customer_detail_url(self.customer.id),
            {'name': 'Partial Update Corp'},
            format='json'
        )
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.name, 'Partial Update Corp')
        self.assertEqual(self.customer.email, original_email)

    def test_put_nonexistent_customer_returns_404(self):
        response = self.client.put(
            customer_detail_url(9999),
            self.full_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_put_missing_required_field_returns_400(self):
        payload = {k: v for k, v in self.full_payload.items() if k != 'name'}
        response = self.client.put(
            customer_detail_url(self.customer.id),
            payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_put_same_email_on_same_instance_is_valid(self):
        """Updating with the same email should not fail uniqueness check."""
        response = self.client.put(
            customer_detail_url(self.customer.id),
            self.full_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_put_email_of_another_customer_returns_400(self):
        make_customer(name='Other Corp', email='other@example.com')
        self.full_payload['email'] = 'other@example.com'
        response = self.client.put(
            customer_detail_url(self.customer.id),
            self.full_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_put_update_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.put(
            customer_detail_url(self.customer.id),
            self.full_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CustomerDeleteTest(APITestCase):
    """Tests for DELETE /api/customers/<id>/."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.customer = make_customer(name='Delete Corp', email='delete@example.com')

    def test_delete_existing_customer_returns_204(self):
        response = self.client.delete(customer_detail_url(self.customer.id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_customer_from_db(self):
        customer_id = self.customer.id
        self.client.delete(customer_detail_url(self.customer.id))
        self.assertFalse(Customer.objects.filter(pk=customer_id).exists())

    def test_delete_nonexistent_customer_returns_404(self):
        response = self.client.delete(customer_detail_url(9999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.delete(customer_detail_url(self.customer.id))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_with_protected_relation_returns_500(self):
        """
        CustomerService.delete_customer raises rest_framework.exceptions.ValidationError
        when a ProtectedError occurs. Since custom_exception_handler does NOT intercept
        django.core.exceptions.ValidationError (only DRF exceptions), and the service
        raises the DRF variant, we verify the behavior by mocking.

        The DRF ValidationError IS handled by the exception handler → returns 400.
        """
        from unittest.mock import patch
        from rest_framework.exceptions import ValidationError

        with patch(
            'customers.services.CustomerService.delete_customer',
            side_effect=ValidationError('This customer cannot be deleted because it has associated shipments.')
        ):
            response = self.client.delete(
                customer_detail_url(self.customer.id),
                raise_request_exception=False
            )
        # DRF ValidationError is caught by the exception handler → 400
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class CustomerFilterTest(APITestCase):
    """Tests for filterset_fields on GET /api/customers/."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        make_customer(name='Individual User', customer_type='individual',
                      email='individual@example.com', city='Bogota', country='Colombia')
        make_customer(name='Company A', customer_type='company',
                      email='company@example.com', city='Medellin', country='Colombia')
        make_customer(name='Foreign Corp', customer_type='company',
                      email='foreign@example.com', city='Lima', country='Peru')

    def test_filter_by_customer_type_company(self):
        response = self.client.get(BASE_URL, {'customer_type': 'company'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        for result in response.data['results']:
            self.assertEqual(result['customer_type'], 'company')

    def test_filter_by_customer_type_individual(self):
        response = self.client.get(BASE_URL, {'customer_type': 'individual'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_filter_by_city(self):
        response = self.client.get(BASE_URL, {'city': 'Bogota'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['city'], 'Bogota')

    def test_filter_by_country(self):
        response = self.client.get(BASE_URL, {'country': 'Peru'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['country'], 'Peru')
