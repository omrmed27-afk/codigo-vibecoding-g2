from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from warehouses.models import Warehouse
from routes.models import Route, RouteStop


BASE_URL = '/api/routes/'


def make_warehouse(**kwargs):
    defaults = {
        'name': 'View Warehouse',
        'address': 'Calle 100',
        'city': 'Bogota',
        'country': 'Colombia',
    }
    defaults.update(kwargs)
    return Warehouse.objects.create(**defaults)


def make_route(warehouse, **kwargs):
    defaults = {
        'name': 'View Route',
        'origin_warehouse': warehouse,
        'status': 'active',
    }
    defaults.update(kwargs)
    return Route.objects.create(**defaults)


class RouteListCreateViewTest(APITestCase):
    """Tests for GET /api/routes/ and POST /api/routes/"""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.warehouse = make_warehouse()

    def _post(self, data):
        return self.client.post(BASE_URL, data, format='json')

    # --- GET list: happy path ---

    def test_list_routes_returns_200(self):
        make_route(self.warehouse)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_routes_returns_paginated_results(self):
        make_route(self.warehouse)
        response = self.client.get(BASE_URL)
        self.assertIn('results', response.data)

    def test_list_routes_empty_returns_200_with_empty_results(self):
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    def test_list_routes_contains_created_route(self):
        make_route(self.warehouse, name='Specific Route')
        response = self.client.get(BASE_URL)
        names = [r['name'] for r in response.data['results']]
        self.assertIn('Specific Route', names)

    # --- GET list: filter by status ---

    def test_list_routes_filter_by_status(self):
        make_route(self.warehouse, name='Active Route', status='active')
        make_route(self.warehouse, name='Inactive Route', status='inactive')
        response = self.client.get(BASE_URL + '?status=active')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        statuses = [r['status'] for r in response.data['results']]
        self.assertTrue(all(s == 'active' for s in statuses))

    # --- POST: happy path ---

    def test_create_route_without_stops_returns_201(self):
        data = {'name': 'New Route', 'origin_warehouse': self.warehouse.pk, 'status': 'active'}
        response = self._post(data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_route_returns_route_data(self):
        data = {'name': 'Route X', 'origin_warehouse': self.warehouse.pk}
        response = self._post(data)
        self.assertEqual(response.data['name'], 'Route X')
        self.assertIn('id', response.data)

    def test_create_route_with_stops_returns_201(self):
        data = {
            'name': 'Route With Stops',
            'origin_warehouse': self.warehouse.pk,
            'stops': [
                {'stop_order': 1, 'address': 'Calle 1', 'city': 'Bogota'},
                {'stop_order': 2, 'address': 'Calle 2', 'city': 'Medellin'},
            ],
        }
        response = self._post(data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['stops']), 2)

    def test_create_route_persists_to_db(self):
        data = {'name': 'Persisted Route', 'origin_warehouse': self.warehouse.pk}
        self._post(data)
        self.assertTrue(Route.objects.filter(name='Persisted Route').exists())

    def test_create_route_response_contains_nested_warehouse(self):
        data = {'name': 'Nested WH Route', 'origin_warehouse': self.warehouse.pk}
        response = self._post(data)
        self.assertIsInstance(response.data['origin_warehouse'], dict)
        self.assertIn('id', response.data['origin_warehouse'])

    # --- POST: unhappy path ---

    def test_create_route_missing_name_returns_400(self):
        data = {'origin_warehouse': self.warehouse.pk}
        response = self._post(data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_route_missing_warehouse_returns_400(self):
        data = {'name': 'No Warehouse'}
        response = self._post(data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_route_invalid_warehouse_returns_400(self):
        data = {'name': 'Bad WH', 'origin_warehouse': 99999}
        response = self._post(data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_route_invalid_status_returns_400(self):
        data = {'name': 'Bad Status', 'origin_warehouse': self.warehouse.pk, 'status': 'unknown'}
        response = self._post(data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_route_stop_missing_required_field_returns_400(self):
        data = {
            'name': 'Route',
            'origin_warehouse': self.warehouse.pk,
            'stops': [{'stop_order': 1, 'city': 'Bogota'}],  # missing address
        }
        response = self._post(data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Authentication ---

    def test_list_routes_unauthenticated_returns_401(self):
        self.client.logout()
        client = APIClient()
        response = client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_route_unauthenticated_returns_401(self):
        client = APIClient()
        data = {'name': 'Route', 'origin_warehouse': self.warehouse.pk}
        response = client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RouteRetrieveUpdateDeleteViewTest(APITestCase):
    """Tests for GET/PUT/PATCH/DELETE /api/routes/<id>/"""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser2', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.warehouse = make_warehouse()
        self.route = make_route(self.warehouse)

    def _url(self, pk=None):
        return f'{BASE_URL}{pk or self.route.pk}/'

    # --- GET detail: happy path ---

    def test_retrieve_route_returns_200(self):
        response = self.client.get(self._url())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_route_returns_correct_data(self):
        response = self.client.get(self._url())
        self.assertEqual(response.data['id'], self.route.pk)
        self.assertEqual(response.data['name'], self.route.name)

    def test_retrieve_route_includes_stops(self):
        RouteStop.objects.create(route=self.route, stop_order=1, address='X', city='Y')
        response = self.client.get(self._url())
        self.assertIn('stops', response.data)
        self.assertEqual(len(response.data['stops']), 1)

    def test_retrieve_route_includes_nested_warehouse(self):
        response = self.client.get(self._url())
        self.assertIsInstance(response.data['origin_warehouse'], dict)

    # --- GET detail: unhappy path ---

    def test_retrieve_nonexistent_route_returns_404(self):
        response = self.client.get(self._url(pk=99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- PUT: happy path ---

    def test_update_route_returns_200(self):
        data = {'name': 'Updated Name', 'origin_warehouse': self.warehouse.pk, 'status': 'inactive'}
        response = self.client.put(self._url(), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_route_persists_changes(self):
        data = {'name': 'Persisted Update', 'origin_warehouse': self.warehouse.pk}
        self.client.put(self._url(), data, format='json')
        self.route.refresh_from_db()
        self.assertEqual(self.route.name, 'Persisted Update')

    def test_update_route_replaces_stops(self):
        RouteStop.objects.create(route=self.route, stop_order=1, address='Old', city='OldCity')
        data = {
            'name': self.route.name,
            'origin_warehouse': self.warehouse.pk,
            'stops': [{'stop_order': 1, 'address': 'New', 'city': 'NewCity'}],
        }
        response = self.client.put(self._url(), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['stops'][0]['city'], 'NewCity')

    # --- PATCH: happy path ---

    def test_partial_update_route_returns_200(self):
        response = self.client.patch(self._url(), {'name': 'Patched'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_partial_update_only_changes_provided_field(self):
        original_status = self.route.status
        self.client.patch(self._url(), {'name': 'Patched Name'}, format='json')
        self.route.refresh_from_db()
        self.assertEqual(self.route.status, original_status)

    # --- PUT: unhappy path ---

    def test_update_nonexistent_route_returns_404(self):
        data = {'name': 'X', 'origin_warehouse': self.warehouse.pk}
        response = self.client.put(self._url(pk=99999), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_route_invalid_warehouse_returns_400(self):
        data = {'name': 'X', 'origin_warehouse': 99999}
        response = self.client.put(self._url(), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- DELETE: happy path ---

    def test_delete_route_returns_204(self):
        response = self.client.delete(self._url())
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_route_removes_from_db(self):
        pk = self.route.pk
        self.client.delete(self._url())
        self.assertFalse(Route.objects.filter(pk=pk).exists())

    def test_delete_route_cascades_stops(self):
        RouteStop.objects.create(route=self.route, stop_order=1, address='X', city='Y')
        pk = self.route.pk
        self.client.delete(self._url())
        self.assertEqual(RouteStop.objects.filter(route_id=pk).count(), 0)

    # --- DELETE: unhappy path ---

    def test_delete_nonexistent_route_returns_404(self):
        response = self.client.delete(self._url(pk=99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- DELETE: PROTECT behavior (route referenced by shipment) ---
    # Cannot test PROTECT at route level without shipments data — omitted per MVP scope.

    # --- Authentication ---

    def test_retrieve_route_unauthenticated_returns_401(self):
        client = APIClient()
        response = client.get(self._url())
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_route_unauthenticated_returns_401(self):
        client = APIClient()
        response = client.delete(self._url())
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RouteStopsActionViewTest(APITestCase):
    """Tests for GET/POST /api/routes/<id>/stops/ and DELETE /api/routes/<id>/stops/<stop_pk>/"""

    def setUp(self):
        self.user = User.objects.create_user(username='stopuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.warehouse = make_warehouse()
        self.route = make_route(self.warehouse)

    def _stops_url(self, route_pk=None):
        pk = route_pk or self.route.pk
        return f'{BASE_URL}{pk}/stops/'

    def _stop_detail_url(self, stop_pk, route_pk=None):
        pk = route_pk or self.route.pk
        return f'{BASE_URL}{pk}/stops/{stop_pk}/'

    # --- GET stops: happy path ---

    def test_list_stops_returns_200(self):
        RouteStop.objects.create(route=self.route, stop_order=1, address='A', city='B')
        response = self.client.get(self._stops_url())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_stops_returns_list(self):
        RouteStop.objects.create(route=self.route, stop_order=1, address='A', city='B')
        response = self.client.get(self._stops_url())
        self.assertIsInstance(response.data, list)

    def test_list_stops_empty_route_returns_empty_list(self):
        response = self.client.get(self._stops_url())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_list_stops_returns_stops_for_correct_route(self):
        other_route = make_route(self.warehouse, name='Other Route')
        RouteStop.objects.create(route=self.route, stop_order=1, address='A', city='A')
        RouteStop.objects.create(route=other_route, stop_order=1, address='B', city='B')
        response = self.client.get(self._stops_url())
        self.assertEqual(len(response.data), 1)

    # --- GET stops: unhappy path ---

    def test_list_stops_nonexistent_route_returns_404(self):
        response = self.client.get(self._stops_url(route_pk=99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- POST stop: happy path ---

    def test_add_stop_returns_201(self):
        data = {'stop_order': 1, 'address': 'Calle 10', 'city': 'Bogota'}
        response = self.client.post(self._stops_url(), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_add_stop_persists_to_db(self):
        data = {'stop_order': 1, 'address': 'Calle 10', 'city': 'Bogota'}
        self.client.post(self._stops_url(), data, format='json')
        self.assertEqual(RouteStop.objects.filter(route=self.route).count(), 1)

    def test_add_stop_response_contains_expected_fields(self):
        data = {'stop_order': 1, 'address': 'Calle 10', 'city': 'Bogota'}
        response = self.client.post(self._stops_url(), data, format='json')
        for field in ['id', 'stop_order', 'address', 'city']:
            self.assertIn(field, response.data)

    def test_add_stop_with_coordinates_returns_201(self):
        data = {
            'stop_order': 1,
            'address': 'Av El Dorado',
            'city': 'Bogota',
            'latitude': '4.710989',
            'longitude': '-74.072090',
        }
        response = self.client.post(self._stops_url(), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # --- POST stop: unhappy path ---

    def test_add_stop_missing_stop_order_returns_400(self):
        data = {'address': 'Calle 10', 'city': 'Bogota'}
        response = self.client.post(self._stops_url(), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_stop_missing_address_returns_400(self):
        data = {'stop_order': 1, 'city': 'Bogota'}
        response = self.client.post(self._stops_url(), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_stop_duplicate_order_returns_400(self):
        RouteStop.objects.create(route=self.route, stop_order=1, address='X', city='Y')
        data = {'stop_order': 1, 'address': 'Z', 'city': 'W'}
        response = self.client.post(self._stops_url(), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_stop_to_nonexistent_route_returns_404(self):
        data = {'stop_order': 1, 'address': 'X', 'city': 'Y'}
        response = self.client.post(self._stops_url(route_pk=99999), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- DELETE stop: happy path ---

    def test_delete_stop_returns_204(self):
        stop = RouteStop.objects.create(route=self.route, stop_order=1, address='X', city='Y')
        response = self.client.delete(self._stop_detail_url(stop.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_stop_removes_from_db(self):
        stop = RouteStop.objects.create(route=self.route, stop_order=1, address='X', city='Y')
        self.client.delete(self._stop_detail_url(stop.pk))
        self.assertFalse(RouteStop.objects.filter(pk=stop.pk).exists())

    # --- DELETE stop: unhappy path ---

    def test_delete_nonexistent_stop_returns_404(self):
        response = self.client.delete(self._stop_detail_url(stop_pk=99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_stop_from_wrong_route_returns_404(self):
        other_route = make_route(self.warehouse, name='Other Route')
        stop = RouteStop.objects.create(route=other_route, stop_order=1, address='X', city='Y')
        # Try to delete stop from self.route even though it belongs to other_route
        response = self.client.delete(self._stop_detail_url(stop.pk))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- Authentication ---

    def test_list_stops_unauthenticated_returns_401(self):
        client = APIClient()
        response = client.get(self._stops_url())
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_add_stop_unauthenticated_returns_401(self):
        client = APIClient()
        data = {'stop_order': 1, 'address': 'X', 'city': 'Y'}
        response = client.post(self._stops_url(), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_stop_unauthenticated_returns_401(self):
        stop = RouteStop.objects.create(route=self.route, stop_order=1, address='X', city='Y')
        client = APIClient()
        response = client.delete(self._stop_detail_url(stop.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
