from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
import datetime
from decimal import Decimal

from drivers.models import Driver
from transport.models import Transport


class TransportViewSetSetupMixin:
    """Shared setUp for TransportViewSet tests."""

    def setUp(self):
        # Auth user (separate from driver user)
        self.auth_user = User.objects.create_user(
            username='api_user',
            password='apipass123',
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.auth_user)

        # Driver user and driver
        self.driver_user = User.objects.create_user(
            username='view_driver',
            password='driverpass123',
            first_name='View',
            last_name='Driver',
        )
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-VIEW-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='555-5001',
            status=Driver.DriverStatus.AVAILABLE,
        )

        # A reusable transport
        self.transport = Transport.objects.create(
            name='View Truck',
            type=Transport.TransportType.TRUCK,
            plate_number='VIEW-001',
            capacity_kg=Decimal('1000.00'),
            capacity_m3=Decimal('10.000'),
        )

    @property
    def list_url(self):
        return '/api/transport/'

    def detail_url(self, pk):
        return f'/api/transport/{pk}/'

    def assign_driver_url(self, pk):
        return f'/api/transport/{pk}/assign-driver/'

    def unassign_driver_url(self, pk):
        return f'/api/transport/{pk}/unassign-driver/'


class TransportListTest(TransportViewSetSetupMixin, APITestCase):
    """Tests for GET /api/transport/ (list)."""

    def test_list_returns_200(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_returns_paginated_response(self):
        response = self.client.get(self.list_url)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)

    def test_list_contains_created_transport(self):
        response = self.client.get(self.list_url)
        ids = [item['id'] for item in response.data['results']]
        self.assertIn(self.transport.pk, ids)

    def test_list_empty_returns_200_with_empty_results(self):
        Transport.objects.all().delete()
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])
        self.assertEqual(response.data['count'], 0)

    def test_list_unauthenticated_returns_401(self):
        client = APIClient()
        response = client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_uses_read_serializer_with_nested_driver(self):
        transport_with_driver = Transport.objects.create(
            name='Driver Truck List',
            type=Transport.TransportType.TRUCK,
            plate_number='LST-DRV-001',
            capacity_kg=Decimal('900.00'),
            capacity_m3=Decimal('9.000'),
            driver=self.driver,
        )
        response = self.client.get(self.list_url)
        result = next(
            (item for item in response.data['results'] if item['id'] == transport_with_driver.pk),
            None
        )
        self.assertIsNotNone(result)
        self.assertIsInstance(result['driver'], dict)


class TransportRetrieveTest(TransportViewSetSetupMixin, APITestCase):
    """Tests for GET /api/transport/{id}/ (retrieve)."""

    def test_retrieve_returns_200(self):
        response = self.client.get(self.detail_url(self.transport.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_object(self):
        response = self.client.get(self.detail_url(self.transport.pk))
        self.assertEqual(response.data['id'], self.transport.pk)
        self.assertEqual(response.data['plate_number'], 'VIEW-001')

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get(self.detail_url(9999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unauthenticated_returns_401(self):
        client = APIClient()
        response = client.get(self.detail_url(self.transport.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_driver_is_nested_object_when_assigned(self):
        self.transport.driver = self.driver
        self.transport.save()
        response = self.client.get(self.detail_url(self.transport.pk))
        self.assertIsInstance(response.data['driver'], dict)
        self.assertIn('license_number', response.data['driver'])

    def test_retrieve_driver_is_null_when_not_assigned(self):
        response = self.client.get(self.detail_url(self.transport.pk))
        self.assertIsNone(response.data['driver'])


class TransportCreateTest(TransportViewSetSetupMixin, APITestCase):
    """Tests for POST /api/transport/ (create)."""

    def test_create_valid_transport_returns_201(self):
        data = {
            'name': 'New Truck',
            'type': 'truck',
            'plate_number': 'NEW-CRT-001',
            'capacity_kg': '1200.00',
            'capacity_m3': '12.000',
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_transport_persists_to_database(self):
        data = {
            'name': 'Persisted Truck',
            'type': 'van',
            'plate_number': 'PRS-001',
            'capacity_kg': '500.00',
            'capacity_m3': '5.000',
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertTrue(Transport.objects.filter(plate_number='PRS-001').exists())

    def test_create_transport_returns_read_serializer_format(self):
        data = {
            'name': 'Read Format Truck',
            'type': 'truck',
            'plate_number': 'RDF-001',
            'capacity_kg': '800.00',
            'capacity_m3': '8.000',
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertIn('id', response.data)
        self.assertIn('created_at', response.data)
        self.assertIn('updated_at', response.data)

    def test_create_with_driver_returns_201(self):
        data = {
            'name': 'Truck With Driver',
            'type': 'truck',
            'plate_number': 'WDR-001',
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
            'driver': self.driver.pk,
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_missing_name_returns_400(self):
        data = {
            'type': 'truck',
            'plate_number': 'MNM-001',
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_type_returns_400(self):
        data = {
            'name': 'No Type',
            'plate_number': 'NTP-001',
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_plate_number_returns_400(self):
        data = {
            'name': 'No Plate',
            'type': 'truck',
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invalid_type_returns_400(self):
        data = {
            'name': 'Bad Type',
            'type': 'spaceship',
            'plate_number': 'BSP-001',
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_plate_number_returns_400(self):
        data = {
            'name': 'Duplicate',
            'type': 'truck',
            'plate_number': 'VIEW-001',  # already exists in setUp
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_with_invalid_driver_pk_returns_400(self):
        data = {
            'name': 'Bad Driver FK',
            'type': 'truck',
            'plate_number': 'BDF-001',
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
            'driver': 9999,
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_unauthenticated_returns_401(self):
        client = APIClient()
        data = {
            'name': 'Unauth Truck',
            'type': 'truck',
            'plate_number': 'UNA-999',
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
        }
        response = client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_with_optional_fields_omitted_applies_defaults(self):
        data = {
            'name': 'Defaults Test',
            'type': 'bicycle',
            'plate_number': 'DFT-001',
            'capacity_kg': '20.00',
            'capacity_m3': '0.100',
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'available')
        self.assertIsNone(response.data['driver'])


class TransportUpdateTest(TransportViewSetSetupMixin, APITestCase):
    """Tests for PUT /api/transport/{id}/ (update)."""

    def test_update_valid_data_returns_200(self):
        data = {
            'name': 'Updated Truck',
            'type': 'van',
            'plate_number': 'VIEW-001',
            'capacity_kg': '1100.00',
            'capacity_m3': '11.000',
        }
        response = self.client.put(self.detail_url(self.transport.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_name_reflected_in_response(self):
        data = {
            'name': 'Renamed Truck',
            'type': 'truck',
            'plate_number': 'VIEW-001',
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
        }
        response = self.client.put(self.detail_url(self.transport.pk), data, format='json')
        self.assertEqual(response.data['name'], 'Renamed Truck')

    def test_update_nonexistent_returns_404(self):
        data = {
            'name': 'Ghost',
            'type': 'truck',
            'plate_number': 'GHO-001',
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
        }
        response = self.client.put(self.detail_url(9999), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_unauthenticated_returns_401(self):
        client = APIClient()
        data = {
            'name': 'Unauth',
            'type': 'truck',
            'plate_number': 'VIEW-001',
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
        }
        response = client.put(self.detail_url(self.transport.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_partial_update_returns_200(self):
        response = self.client.patch(
            self.detail_url(self.transport.pk),
            {'name': 'Partial Update'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Partial Update')

    def test_partial_update_nonexistent_returns_404(self):
        response = self.client.patch(
            self.detail_url(9999),
            {'name': 'Ghost'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_with_invalid_type_returns_400(self):
        data = {
            'name': 'Bad Type',
            'type': 'submarine',
            'plate_number': 'VIEW-001',
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
        }
        response = self.client.put(self.detail_url(self.transport.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_returns_read_serializer_format(self):
        data = {
            'name': 'Format Check',
            'type': 'truck',
            'plate_number': 'VIEW-001',
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
        }
        response = self.client.put(self.detail_url(self.transport.pk), data, format='json')
        self.assertIn('created_at', response.data)
        self.assertIn('updated_at', response.data)


class TransportDeleteTest(TransportViewSetSetupMixin, APITestCase):
    """Tests for DELETE /api/transport/{id}/ (destroy)."""

    def test_delete_returns_204(self):
        response = self.client.delete(self.detail_url(self.transport.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_from_database(self):
        pk = self.transport.pk
        self.client.delete(self.detail_url(pk))
        self.assertFalse(Transport.objects.filter(pk=pk).exists())

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete(self.detail_url(9999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated_returns_401(self):
        client = APIClient()
        response = client.delete(self.detail_url(self.transport.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TransportAssignDriverActionTest(TransportViewSetSetupMixin, APITestCase):
    """Tests for POST /api/transport/{id}/assign-driver/."""

    def test_assign_driver_returns_200(self):
        response = self.client.post(
            self.assign_driver_url(self.transport.pk),
            {'driver_id': self.driver.pk},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_assign_driver_sets_driver_in_response(self):
        response = self.client.post(
            self.assign_driver_url(self.transport.pk),
            {'driver_id': self.driver.pk},
            format='json',
        )
        self.assertIsNotNone(response.data['driver'])
        self.assertEqual(response.data['driver']['id'], self.driver.pk)

    def test_assign_driver_persists_to_database(self):
        self.client.post(
            self.assign_driver_url(self.transport.pk),
            {'driver_id': self.driver.pk},
            format='json',
        )
        self.transport.refresh_from_db()
        self.assertEqual(self.transport.driver.pk, self.driver.pk)

    def test_assign_driver_missing_driver_id_returns_400(self):
        response = self.client.post(
            self.assign_driver_url(self.transport.pk),
            {},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_assign_driver_nonexistent_driver_id_returns_404(self):
        response = self.client.post(
            self.assign_driver_url(self.transport.pk),
            {'driver_id': 9999},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_assign_driver_nonexistent_transport_returns_404(self):
        response = self.client.post(
            self.assign_driver_url(9999),
            {'driver_id': self.driver.pk},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_assign_driver_unauthenticated_returns_401(self):
        client = APIClient()
        response = client.post(
            self.assign_driver_url(self.transport.pk),
            {'driver_id': self.driver.pk},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_assign_driver_returns_nested_driver_in_response(self):
        response = self.client.post(
            self.assign_driver_url(self.transport.pk),
            {'driver_id': self.driver.pk},
            format='json',
        )
        driver_data = response.data['driver']
        self.assertIn('license_number', driver_data)
        self.assertIn('phone', driver_data)
        self.assertIn('status', driver_data)


class TransportUnassignDriverActionTest(TransportViewSetSetupMixin, APITestCase):
    """Tests for POST /api/transport/{id}/unassign-driver/."""

    def setUp(self):
        super().setUp()
        # Assign a driver to transport before each test
        self.transport.driver = self.driver
        self.transport.save()

    def test_unassign_driver_returns_200(self):
        response = self.client.post(
            self.unassign_driver_url(self.transport.pk),
            {},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unassign_driver_sets_driver_to_null_in_response(self):
        response = self.client.post(
            self.unassign_driver_url(self.transport.pk),
            {},
            format='json',
        )
        self.assertIsNone(response.data['driver'])

    def test_unassign_driver_persists_null_to_database(self):
        self.client.post(
            self.unassign_driver_url(self.transport.pk),
            {},
            format='json',
        )
        self.transport.refresh_from_db()
        self.assertIsNone(self.transport.driver)

    def test_unassign_driver_nonexistent_transport_returns_404(self):
        response = self.client.post(
            self.unassign_driver_url(9999),
            {},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unassign_driver_unauthenticated_returns_401(self):
        client = APIClient()
        response = client.post(
            self.unassign_driver_url(self.transport.pk),
            {},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unassign_driver_on_transport_with_no_driver_returns_200(self):
        # Remove driver first
        self.transport.driver = None
        self.transport.save()
        response = self.client.post(
            self.unassign_driver_url(self.transport.pk),
            {},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['driver'])


class TransportFilterTest(TransportViewSetSetupMixin, APITestCase):
    """Tests for filtering the transport list."""

    def setUp(self):
        super().setUp()
        self.maintenance_transport = Transport.objects.create(
            name='Maintenance Van',
            type=Transport.TransportType.VAN,
            plate_number='MNT-001',
            capacity_kg=Decimal('300.00'),
            capacity_m3=Decimal('3.000'),
            status=Transport.TransportStatus.MAINTENANCE,
        )
        self.in_transit_transport = Transport.objects.create(
            name='In Transit Bike',
            type=Transport.TransportType.BICYCLE,
            plate_number='ITR-001',
            capacity_kg=Decimal('20.00'),
            capacity_m3=Decimal('0.100'),
            status=Transport.TransportStatus.IN_TRANSIT,
        )

    def test_filter_by_status_returns_only_matching(self):
        response = self.client.get(f'{self.list_url}?status=maintenance')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['status'], 'maintenance')

    def test_filter_by_type_returns_only_matching(self):
        response = self.client.get(f'{self.list_url}?type=bicycle')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['type'], 'bicycle')

    def test_filter_by_nonexistent_status_returns_empty(self):
        response = self.client.get(f'{self.list_url}?status=available&type=bicycle')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # The VIEW-001 truck is available but type truck, ITR-001 is bicycle but in_transit
        # No result should have both available + bicycle unless self.transport is bicycle
        # (self.transport is truck + available, so result should be empty)
        for item in response.data['results']:
            self.assertEqual(item['type'], 'bicycle')
            self.assertEqual(item['status'], 'available')
