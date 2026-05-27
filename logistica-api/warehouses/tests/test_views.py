from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from warehouses.models import Warehouse


BASE_URL = '/api/warehouses/'


def detail_url(pk):
    return f'{BASE_URL}{pk}/'


class WarehouseListCreateViewTest(APITestCase):
    """Tests for GET /api/warehouses/ and POST /api/warehouses/."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.valid_payload = {
            'name': 'Main Warehouse',
            'address': 'Calle 123 # 45-67',
            'city': 'Bogota',
            'country': 'Colombia',
        }

    # --- GET list ---

    def test_list_returns_200(self):
        """GET /api/warehouses/ returns 200 OK."""
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_empty_returns_empty_results(self):
        """GET /api/warehouses/ with no warehouses returns empty results list."""
        response = self.client.get(BASE_URL)
        self.assertEqual(response.data['results'], [])
        self.assertEqual(response.data['count'], 0)

    def test_list_includes_created_warehouse(self):
        """GET /api/warehouses/ includes existing warehouses in results."""
        Warehouse.objects.create(
            name='Listed WH',
            address='Addr',
            city='Bogota',
            country='Colombia',
        )
        response = self.client.get(BASE_URL)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['name'], 'Listed WH')

    def test_list_returns_paginated_response(self):
        """GET /api/warehouses/ response includes pagination keys."""
        response = self.client.get(BASE_URL)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)

    def test_list_unauthenticated_returns_401(self):
        """GET /api/warehouses/ without authentication returns 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- POST create ---

    def test_create_returns_201(self):
        """POST /api/warehouses/ with valid data returns 201 Created."""
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_persists_warehouse(self):
        """POST /api/warehouses/ saves the warehouse to the database."""
        self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(Warehouse.objects.count(), 1)

    def test_create_returns_read_serializer_data(self):
        """POST /api/warehouses/ response includes id, created_at, updated_at."""
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertIn('id', response.data)
        self.assertIn('created_at', response.data)
        self.assertIn('updated_at', response.data)

    def test_create_with_coordinates_returns_201(self):
        """POST /api/warehouses/ with coordinates returns 201."""
        payload = {**self.valid_payload, 'latitude': '4.711', 'longitude': '-74.072'}
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_missing_name_returns_400(self):
        """POST /api/warehouses/ without name returns 400."""
        payload = {k: v for k, v in self.valid_payload.items() if k != 'name'}
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_address_returns_400(self):
        """POST /api/warehouses/ without address returns 400."""
        payload = {k: v for k, v in self.valid_payload.items() if k != 'address'}
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_city_returns_400(self):
        """POST /api/warehouses/ without city returns 400."""
        payload = {k: v for k, v in self.valid_payload.items() if k != 'city'}
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_country_returns_400(self):
        """POST /api/warehouses/ without country returns 400."""
        payload = {k: v for k, v in self.valid_payload.items() if k != 'country'}
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_unauthenticated_returns_401(self):
        """POST /api/warehouses/ without authentication returns 401."""
        self.client.force_authenticate(user=None)
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_latitude_without_longitude_returns_400(self):
        """POST /api/warehouses/ with latitude only returns 400."""
        payload = {**self.valid_payload, 'latitude': '4.711'}
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_longitude_without_latitude_returns_400(self):
        """POST /api/warehouses/ with longitude only returns 400."""
        payload = {**self.valid_payload, 'longitude': '-74.072'}
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invalid_latitude_above_90_returns_400(self):
        """POST /api/warehouses/ with latitude > 90 returns 400."""
        payload = {**self.valid_payload, 'latitude': '91', 'longitude': '0'}
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invalid_longitude_above_180_returns_400(self):
        """POST /api/warehouses/ with longitude > 180 returns 400."""
        payload = {**self.valid_payload, 'latitude': '0', 'longitude': '181'}
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_error_response_uses_custom_format(self):
        """POST /api/warehouses/ error response uses custom error format."""
        payload = {k: v for k, v in self.valid_payload.items() if k != 'name'}
        response = self.client.post(BASE_URL, payload, format='json')
        self.assertIn('error', response.data)
        self.assertIn('code', response.data['error'])
        self.assertIn('message', response.data['error'])

    def test_create_with_optional_fields_omitted_uses_defaults(self):
        """POST /api/warehouses/ without optional fields uses defaults (is_active=True, coords=null)."""
        response = self.client.post(BASE_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['is_active'])
        self.assertIsNone(response.data['latitude'])
        self.assertIsNone(response.data['longitude'])


class WarehouseRetrieveViewTest(APITestCase):
    """Tests for GET /api/warehouses/{id}/."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.warehouse = Warehouse.objects.create(
            name='Retrieve WH',
            address='Retrieve Addr 1',
            city='Bogota',
            country='Colombia',
        )

    def test_retrieve_returns_200(self):
        """GET /api/warehouses/{id}/ returns 200 OK."""
        response = self.client.get(detail_url(self.warehouse.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_warehouse(self):
        """GET /api/warehouses/{id}/ returns the correct warehouse."""
        response = self.client.get(detail_url(self.warehouse.pk))
        self.assertEqual(response.data['id'], self.warehouse.pk)
        self.assertEqual(response.data['name'], 'Retrieve WH')

    def test_retrieve_nonexistent_returns_404(self):
        """GET /api/warehouses/9999/ returns 404 Not Found."""
        response = self.client.get(detail_url(9999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unauthenticated_returns_401(self):
        """GET /api/warehouses/{id}/ without authentication returns 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(detail_url(self.warehouse.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_includes_all_read_fields(self):
        """GET /api/warehouses/{id}/ response includes all expected fields."""
        response = self.client.get(detail_url(self.warehouse.pk))
        expected_fields = {
            'id', 'name', 'address', 'city', 'country',
            'latitude', 'longitude', 'is_active', 'created_at', 'updated_at',
        }
        self.assertEqual(set(response.data.keys()), expected_fields)


class WarehouseUpdateViewTest(APITestCase):
    """Tests for PUT /api/warehouses/{id}/ and PATCH /api/warehouses/{id}/."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.warehouse = Warehouse.objects.create(
            name='Original Name',
            address='Original Addr',
            city='Bogota',
            country='Colombia',
        )
        self.valid_payload = {
            'name': 'Updated Name',
            'address': 'Updated Addr',
            'city': 'Medellin',
            'country': 'Colombia',
        }

    def test_put_returns_200(self):
        """PUT /api/warehouses/{id}/ with valid data returns 200 OK."""
        response = self.client.put(detail_url(self.warehouse.pk), self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_put_updates_name(self):
        """PUT /api/warehouses/{id}/ updates the name field."""
        self.client.put(detail_url(self.warehouse.pk), self.valid_payload, format='json')
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.name, 'Updated Name')

    def test_put_updates_city(self):
        """PUT /api/warehouses/{id}/ updates the city field."""
        self.client.put(detail_url(self.warehouse.pk), self.valid_payload, format='json')
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.city, 'Medellin')

    def test_put_returns_read_serializer_data(self):
        """PUT /api/warehouses/{id}/ response uses read serializer (includes id)."""
        response = self.client.put(detail_url(self.warehouse.pk), self.valid_payload, format='json')
        self.assertIn('id', response.data)
        self.assertIn('created_at', response.data)

    def test_put_nonexistent_returns_404(self):
        """PUT /api/warehouses/9999/ returns 404 Not Found."""
        response = self.client.put(detail_url(9999), self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_put_unauthenticated_returns_401(self):
        """PUT /api/warehouses/{id}/ without authentication returns 401."""
        self.client.force_authenticate(user=None)
        response = self.client.put(detail_url(self.warehouse.pk), self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_put_missing_required_field_returns_400(self):
        """PUT /api/warehouses/{id}/ without required field returns 400."""
        payload = {k: v for k, v in self.valid_payload.items() if k != 'name'}
        response = self.client.put(detail_url(self.warehouse.pk), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_partial_update_returns_200(self):
        """PATCH /api/warehouses/{id}/ with a single field returns 200 OK."""
        response = self.client.patch(
            detail_url(self.warehouse.pk),
            {'name': 'Patched Name'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_partial_update_changes_only_supplied_field(self):
        """PATCH /api/warehouses/{id}/ updates only the supplied field."""
        self.client.patch(
            detail_url(self.warehouse.pk),
            {'name': 'Patched Name'},
            format='json',
        )
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.name, 'Patched Name')
        self.assertEqual(self.warehouse.city, 'Bogota')  # unchanged

    def test_patch_nonexistent_returns_404(self):
        """PATCH /api/warehouses/9999/ returns 404 Not Found."""
        response = self.client.patch(detail_url(9999), {'name': 'X'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_put_with_coordinates_returns_200(self):
        """PUT /api/warehouses/{id}/ with valid coordinates returns 200."""
        payload = {**self.valid_payload, 'latitude': '4.711', 'longitude': '-74.072'}
        response = self.client.put(detail_url(self.warehouse.pk), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_put_invalid_latitude_returns_400(self):
        """PUT /api/warehouses/{id}/ with latitude > 90 returns 400."""
        payload = {**self.valid_payload, 'latitude': '91', 'longitude': '0'}
        response = self.client.put(detail_url(self.warehouse.pk), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class WarehouseDeleteViewTest(APITestCase):
    """Tests for DELETE /api/warehouses/{id}/."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.warehouse = Warehouse.objects.create(
            name='Delete WH',
            address='Delete Addr',
            city='Bogota',
            country='Colombia',
        )

    def test_delete_returns_204(self):
        """DELETE /api/warehouses/{id}/ returns 204 No Content."""
        response = self.client.delete(detail_url(self.warehouse.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_warehouse_from_db(self):
        """DELETE /api/warehouses/{id}/ removes the warehouse from the database."""
        self.client.delete(detail_url(self.warehouse.pk))
        self.assertFalse(Warehouse.objects.filter(pk=self.warehouse.pk).exists())

    def test_delete_nonexistent_returns_404(self):
        """DELETE /api/warehouses/9999/ returns 404 Not Found."""
        response = self.client.delete(detail_url(9999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated_returns_401(self):
        """DELETE /api/warehouses/{id}/ without authentication returns 401."""
        self.client.force_authenticate(user=None)
        response = self.client.delete(detail_url(self.warehouse.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_warehouse_with_products_raises_server_error(self):
        """DELETE /api/warehouses/{id}/ when warehouse has products raises an error.

        The service layer raises django.core.exceptions.ValidationError which
        is not caught by the custom DRF exception handler (it only handles DRF
        exceptions). The exception propagates and Django returns a 500. The
        service-level behavior (ValidationError raised) is tested in
        test_services.py::WarehouseServiceDeleteTest.
        """
        from products.models import Product
        from suppliers.models import Supplier

        supplier = Supplier.objects.create(
            name='Supplier Test',
            contact_name='Jane Doe',
            email='jane@supplier.com',
            phone='+57301000000',
            address='Supplier Addr',
            city='Bogota',
            country='Colombia',
        )
        Product.objects.create(
            name='Laptop Pro',
            sku='LAP-PRO-001',
            weight_kg=Decimal('2.000'),
            width_cm=Decimal('34.00'),
            height_cm=Decimal('2.00'),
            depth_cm=Decimal('24.00'),
            unit_price=Decimal('1200.00'),
            stock_quantity=5,
            supplier=supplier,
            warehouse=self.warehouse,
        )
        # raise_request_exception=False prevents the test client from
        # re-raising the uncaught Django ValidationError so we can inspect
        # the HTTP response code.
        self.client.raise_request_exception = False
        response = self.client.delete(detail_url(self.warehouse.pk))
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class WarehouseFilterTest(APITestCase):
    """Tests for filterset_fields: is_active, city, country."""

    def setUp(self):
        self.user = User.objects.create_user(username='filteruser', password='filterpass123')
        self.client.force_authenticate(user=self.user)
        Warehouse.objects.create(
            name='Active WH Bogota',
            address='Addr A',
            city='Bogota',
            country='Colombia',
            is_active=True,
        )
        Warehouse.objects.create(
            name='Inactive WH Bogota',
            address='Addr B',
            city='Bogota',
            country='Colombia',
            is_active=False,
        )
        Warehouse.objects.create(
            name='Active WH Medellin',
            address='Addr C',
            city='Medellin',
            country='Colombia',
            is_active=True,
        )

    def test_filter_by_is_active_true(self):
        """GET /api/warehouses/?is_active=true returns only active warehouses."""
        response = self.client.get(BASE_URL, {'is_active': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_filter_by_is_active_false(self):
        """GET /api/warehouses/?is_active=false returns only inactive warehouses."""
        response = self.client.get(BASE_URL, {'is_active': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_filter_by_city(self):
        """GET /api/warehouses/?city=Bogota returns only Bogota warehouses."""
        response = self.client.get(BASE_URL, {'city': 'Bogota'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_filter_by_country(self):
        """GET /api/warehouses/?country=Colombia returns all warehouses in Colombia."""
        response = self.client.get(BASE_URL, {'country': 'Colombia'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)

    def test_filter_city_no_match_returns_empty(self):
        """GET /api/warehouses/?city=Nonexistent returns empty results."""
        response = self.client.get(BASE_URL, {'city': 'Nonexistent City'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
