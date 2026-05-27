"""
Tests for shipments API endpoints — ShipmentViewSet.

Base URL prefix: /api/shipments/

Covers:
- GET /api/shipments/          list (200, paginated, empty)
- POST /api/shipments/         create (201, 400 for invalid)
- GET /api/shipments/{id}/     retrieve (200, 404)
- PUT /api/shipments/{id}/     update (200, 400, 404)
- DELETE /api/shipments/{id}/  destroy (204, 404)
- POST /api/shipments/{id}/assign-transport/   (200, 400, 404)
- POST /api/shipments/{id}/mark-delivered/     (200, 400)
- POST /api/shipments/{id}/cancel/             (200, 400)
- Authentication: 401 when unauthenticated
"""
import datetime
from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from shipments.models import Shipment, ShipmentProduct

from .fixtures import (
    make_warehouse,
    make_supplier,
    make_customer,
    make_product,
    make_driver_user,
    make_driver,
    make_transport,
    make_route,
    make_shipment,
    make_shipment_product,
)

BASE_URL = '/api/shipments/'


def detail_url(pk):
    return f'{BASE_URL}{pk}/'


def action_url(pk, action_path):
    return f'{BASE_URL}{pk}/{action_path}/'


class ShipmentViewSetSetupMixin:
    """Shared setUp for all ShipmentViewSet test classes."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.warehouse = make_warehouse()
        self.supplier = make_supplier()
        self.customer = make_customer()
        self.product = make_product(self.supplier, self.warehouse)

        driver_user = make_driver_user()
        self.driver = make_driver(driver_user)
        self.transport = make_transport(self.driver)
        self.route = make_route(self.warehouse)

        self.shipment = make_shipment(self.customer, self.warehouse)
        make_shipment_product(self.shipment, self.product, quantity=1)

        self.valid_create_data = {
            'customer': self.customer.pk,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': '100 Main St',
            'destination_city': 'Bogota',
            'destination_country': 'Colombia',
            'scheduled_delivery_date': '2026-07-01',
            'weight_kg': '5.000',
            'products': [
                {'product': self.product.pk, 'quantity': 2},
            ],
        }


class ShipmentListTest(ShipmentViewSetSetupMixin, APITestCase):

    def test_list_returns_200(self):
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_returns_paginated_results(self):
        response = self.client.get(BASE_URL)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)

    def test_list_contains_created_shipment(self):
        response = self.client.get(BASE_URL)
        ids = [s['id'] for s in response.data['results']]
        self.assertIn(self.shipment.pk, ids)

    def test_list_empty_when_no_shipments(self):
        Shipment.objects.all().delete()
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    def test_list_unauthenticated_returns_401(self):
        client = APIClient()
        response = client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ShipmentCreateTest(ShipmentViewSetSetupMixin, APITestCase):

    def test_create_returns_201(self):
        response = self.client.post(BASE_URL, self.valid_create_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_returns_shipment_with_tracking_number(self):
        response = self.client.post(BASE_URL, self.valid_create_data, format='json')
        self.assertIn('tracking_number', response.data)
        self.assertTrue(response.data['tracking_number'].startswith('SHIP-'))

    def test_create_sets_status_pending(self):
        response = self.client.post(BASE_URL, self.valid_create_data, format='json')
        self.assertEqual(response.data['status'], 'pending')

    def test_create_persists_to_db(self):
        count_before = Shipment.objects.count()
        self.client.post(BASE_URL, self.valid_create_data, format='json')
        self.assertEqual(Shipment.objects.count(), count_before + 1)

    def test_create_with_notes(self):
        data = {**self.valid_create_data, 'notes': 'Fragile'}
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['notes'], 'Fragile')

    def test_create_without_notes_defaults_to_null(self):
        response = self.client.post(BASE_URL, self.valid_create_data, format='json')
        self.assertIsNone(response.data.get('notes'))

    def test_create_missing_customer_returns_400(self):
        data = {**self.valid_create_data}
        del data['customer']
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_origin_warehouse_returns_400(self):
        data = {**self.valid_create_data}
        del data['origin_warehouse']
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_weight_kg_returns_400(self):
        data = {**self.valid_create_data}
        del data['weight_kg']
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_empty_products_returns_400(self):
        data = {**self.valid_create_data, 'products': []}
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_products_returns_400(self):
        data = {
            **self.valid_create_data,
            'products': [
                {'product': self.product.pk, 'quantity': 1},
                {'product': self.product.pk, 'quantity': 2},
            ],
        }
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invalid_customer_pk_returns_400(self):
        data = {**self.valid_create_data, 'customer': 99999}
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invalid_product_pk_returns_400(self):
        data = {**self.valid_create_data, 'products': [{'product': 99999, 'quantity': 1}]}
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_unauthenticated_returns_401(self):
        client = APIClient()
        response = client.post(BASE_URL, self.valid_create_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ShipmentRetrieveTest(ShipmentViewSetSetupMixin, APITestCase):

    def test_retrieve_returns_200(self):
        response = self.client.get(detail_url(self.shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_shipment(self):
        response = self.client.get(detail_url(self.shipment.pk))
        self.assertEqual(response.data['id'], self.shipment.pk)
        self.assertEqual(response.data['tracking_number'], self.shipment.tracking_number)

    def test_retrieve_includes_nested_customer(self):
        response = self.client.get(detail_url(self.shipment.pk))
        self.assertIn('customer', response.data)
        self.assertEqual(response.data['customer']['id'], self.customer.pk)

    def test_retrieve_includes_nested_warehouse(self):
        response = self.client.get(detail_url(self.shipment.pk))
        self.assertIn('origin_warehouse', response.data)
        self.assertEqual(response.data['origin_warehouse']['id'], self.warehouse.pk)

    def test_retrieve_includes_shipment_products(self):
        response = self.client.get(detail_url(self.shipment.pk))
        self.assertIn('shipment_products', response.data)
        self.assertEqual(len(response.data['shipment_products']), 1)

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get(detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unauthenticated_returns_401(self):
        client = APIClient()
        response = client.get(detail_url(self.shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ShipmentUpdateTest(ShipmentViewSetSetupMixin, APITestCase):

    def test_update_returns_200(self):
        data = {**self.valid_create_data, 'destination_city': 'Medellin'}
        response = self.client.put(detail_url(self.shipment.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_changes_destination_city(self):
        data = {**self.valid_create_data, 'destination_city': 'Medellin'}
        response = self.client.put(detail_url(self.shipment.pk), data, format='json')
        self.assertEqual(response.data['destination_city'], 'Medellin')

    def test_update_persists_to_db(self):
        data = {**self.valid_create_data, 'destination_city': 'Cali'}
        self.client.put(detail_url(self.shipment.pk), data, format='json')
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.destination_city, 'Cali')

    def test_update_replaces_products(self):
        product2 = make_product(
            self.supplier, self.warehouse, sku='TABLET-003',
            name='Tablet', unit_price=Decimal('600.00'),
            weight_kg=Decimal('0.500'),
        )
        data = {
            **self.valid_create_data,
            'products': [{'product': product2.pk, 'quantity': 5}],
        }
        response = self.client.put(detail_url(self.shipment.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['shipment_products']), 1)

    def test_update_missing_required_field_returns_400(self):
        data = {**self.valid_create_data}
        del data['customer']
        response = self.client.put(detail_url(self.shipment.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_nonexistent_returns_404(self):
        response = self.client.put(detail_url(99999), self.valid_create_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_unauthenticated_returns_401(self):
        client = APIClient()
        response = client.put(detail_url(self.shipment.pk), self.valid_create_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ShipmentDeleteTest(ShipmentViewSetSetupMixin, APITestCase):

    def test_delete_returns_204(self):
        response = self.client.delete(detail_url(self.shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_from_db(self):
        pk = self.shipment.pk
        self.client.delete(detail_url(pk))
        self.assertFalse(Shipment.objects.filter(pk=pk).exists())

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete(detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated_returns_401(self):
        client = APIClient()
        response = client.delete(detail_url(self.shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AssignTransportActionTest(ShipmentViewSetSetupMixin, APITestCase):

    def test_assign_transport_returns_200(self):
        response = self.client.post(
            action_url(self.shipment.pk, 'assign-transport'),
            {'transport_id': self.transport.pk},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_assign_transport_changes_status_to_picked_up(self):
        self.client.post(
            action_url(self.shipment.pk, 'assign-transport'),
            {'transport_id': self.transport.pk},
            format='json',
        )
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.status, Shipment.ShipmentStatus.PICKED_UP)

    def test_assign_transport_with_route(self):
        response = self.client.post(
            action_url(self.shipment.pk, 'assign-transport'),
            {'transport_id': self.transport.pk, 'route_id': self.route.pk},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.route, self.route)

    def test_assign_transport_missing_transport_id_returns_400(self):
        response = self.client.post(
            action_url(self.shipment.pk, 'assign-transport'),
            {},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_assign_transport_invalid_transport_id_returns_404(self):
        response = self.client.post(
            action_url(self.shipment.pk, 'assign-transport'),
            {'transport_id': 99999},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_assign_transport_invalid_route_id_returns_404(self):
        response = self.client.post(
            action_url(self.shipment.pk, 'assign-transport'),
            {'transport_id': self.transport.pk, 'route_id': 99999},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_assign_transport_to_non_pending_returns_400(self):
        self.shipment.status = Shipment.ShipmentStatus.IN_TRANSIT
        self.shipment.save()
        response = self.client.post(
            action_url(self.shipment.pk, 'assign-transport'),
            {'transport_id': self.transport.pk},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_assign_transport_to_delivered_returns_400(self):
        self.shipment.status = Shipment.ShipmentStatus.DELIVERED
        self.shipment.save()
        response = self.client.post(
            action_url(self.shipment.pk, 'assign-transport'),
            {'transport_id': self.transport.pk},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_assign_transport_nonexistent_shipment_returns_404(self):
        response = self.client.post(
            action_url(99999, 'assign-transport'),
            {'transport_id': self.transport.pk},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_assign_transport_unauthenticated_returns_401(self):
        client = APIClient()
        response = client.post(
            action_url(self.shipment.pk, 'assign-transport'),
            {'transport_id': self.transport.pk},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MarkDeliveredActionTest(ShipmentViewSetSetupMixin, APITestCase):

    def _set_status(self, s):
        self.shipment.status = s
        self.shipment.save()

    def test_mark_delivered_from_picked_up_returns_200(self):
        self._set_status(Shipment.ShipmentStatus.PICKED_UP)
        response = self.client.post(action_url(self.shipment.pk, 'mark-delivered'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_mark_delivered_from_in_transit_returns_200(self):
        self._set_status(Shipment.ShipmentStatus.IN_TRANSIT)
        response = self.client.post(action_url(self.shipment.pk, 'mark-delivered'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_mark_delivered_sets_status_in_response(self):
        self._set_status(Shipment.ShipmentStatus.PICKED_UP)
        response = self.client.post(action_url(self.shipment.pk, 'mark-delivered'))
        self.assertEqual(response.data['status'], 'delivered')

    def test_mark_delivered_from_pending_returns_400(self):
        response = self.client.post(action_url(self.shipment.pk, 'mark-delivered'))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mark_delivered_from_cancelled_returns_400(self):
        self._set_status(Shipment.ShipmentStatus.CANCELLED)
        response = self.client.post(action_url(self.shipment.pk, 'mark-delivered'))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mark_delivered_from_delivered_returns_400(self):
        self._set_status(Shipment.ShipmentStatus.DELIVERED)
        response = self.client.post(action_url(self.shipment.pk, 'mark-delivered'))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mark_delivered_nonexistent_returns_404(self):
        response = self.client.post(action_url(99999, 'mark-delivered'))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_mark_delivered_unauthenticated_returns_401(self):
        self._set_status(Shipment.ShipmentStatus.PICKED_UP)
        client = APIClient()
        response = client.post(action_url(self.shipment.pk, 'mark-delivered'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CancelActionTest(ShipmentViewSetSetupMixin, APITestCase):

    def _set_status(self, s):
        self.shipment.status = s
        self.shipment.save()

    def test_cancel_from_pending_returns_200(self):
        response = self.client.post(action_url(self.shipment.pk, 'cancel'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cancel_from_picked_up_returns_200(self):
        self._set_status(Shipment.ShipmentStatus.PICKED_UP)
        response = self.client.post(action_url(self.shipment.pk, 'cancel'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cancel_from_in_transit_returns_200(self):
        self._set_status(Shipment.ShipmentStatus.IN_TRANSIT)
        response = self.client.post(action_url(self.shipment.pk, 'cancel'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cancel_sets_status_cancelled_in_response(self):
        response = self.client.post(action_url(self.shipment.pk, 'cancel'))
        self.assertEqual(response.data['status'], 'cancelled')

    def test_cancel_from_delivered_returns_400(self):
        self._set_status(Shipment.ShipmentStatus.DELIVERED)
        response = self.client.post(action_url(self.shipment.pk, 'cancel'))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cancel_from_cancelled_returns_400(self):
        self._set_status(Shipment.ShipmentStatus.CANCELLED)
        response = self.client.post(action_url(self.shipment.pk, 'cancel'))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cancel_nonexistent_returns_404(self):
        response = self.client.post(action_url(99999, 'cancel'))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cancel_unauthenticated_returns_401(self):
        client = APIClient()
        response = client.post(action_url(self.shipment.pk, 'cancel'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ShipmentFilterTest(ShipmentViewSetSetupMixin, APITestCase):
    """Test filterset_fields declared on the ViewSet."""

    def test_filter_by_status_pending(self):
        response = self.client.get(BASE_URL, {'status': 'pending'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['status'], 'pending')

    def test_filter_by_customer(self):
        response = self.client.get(BASE_URL, {'customer': self.customer.pk})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # All returned shipments must belong to this customer
        for item in response.data['results']:
            self.assertEqual(item['customer']['id'], self.customer.pk)
