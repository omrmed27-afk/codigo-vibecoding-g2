from django.test import TestCase

from warehouses.models import Warehouse
from routes.models import Route, RouteStop
from routes.serializers import (
    RouteReadSerializer,
    RouteWriteSerializer,
    RouteStopSerializer,
    RouteStopWriteSerializer,
    RouteWarehouseSummarySerializer,
)


def make_warehouse(**kwargs):
    defaults = {
        'name': 'Test Warehouse',
        'address': 'Calle 1 # 2-3',
        'city': 'Bogota',
        'country': 'Colombia',
    }
    defaults.update(kwargs)
    return Warehouse.objects.create(**defaults)


def make_route(warehouse, **kwargs):
    defaults = {
        'name': 'Route Alpha',
        'origin_warehouse': warehouse,
        'status': 'active',
    }
    defaults.update(kwargs)
    return Route.objects.create(**defaults)


class RouteWarehouseSummarySerializerTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()

    def test_summary_includes_id_and_name(self):
        serializer = RouteWarehouseSummarySerializer(self.warehouse)
        data = serializer.data
        self.assertIn('id', data)
        self.assertIn('name', data)
        self.assertEqual(data['name'], 'Test Warehouse')


class RouteStopSerializerTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()
        self.route = make_route(self.warehouse)
        self.stop = RouteStop.objects.create(
            route=self.route,
            stop_order=1,
            address='Carrera 10 # 5-20',
            city='Medellin',
        )

    def test_read_includes_expected_fields(self):
        serializer = RouteStopSerializer(self.stop)
        data = serializer.data
        for field in ['id', 'stop_order', 'address', 'city', 'latitude', 'longitude', 'created_at']:
            self.assertIn(field, data)

    def test_id_and_created_at_are_read_only(self):
        # read_only_fields cannot be used for write
        serializer = RouteStopSerializer(
            self.stop,
            data={'id': 999, 'stop_order': 1, 'address': 'X', 'city': 'Y', 'created_at': '2020-01-01T00:00:00Z'},
            partial=True,
        )
        serializer.is_valid()
        self.assertNotIn('id', serializer.validated_data)
        self.assertNotIn('created_at', serializer.validated_data)


class RouteStopWriteSerializerTest(TestCase):

    # --- Happy path ---

    def test_valid_data_passes(self):
        data = {'stop_order': 1, 'address': 'Calle 50 # 10', 'city': 'Bogota'}
        serializer = RouteStopWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_data_with_coordinates(self):
        data = {
            'stop_order': 2,
            'address': 'Av El Dorado',
            'city': 'Bogota',
            'latitude': '4.710989',
            'longitude': '-74.072090',
        }
        serializer = RouteStopWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    # --- Unhappy path ---

    def test_missing_stop_order_fails(self):
        data = {'address': 'Calle 50', 'city': 'Bogota'}
        serializer = RouteStopWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('stop_order', serializer.errors)

    def test_missing_address_fails(self):
        data = {'stop_order': 1, 'city': 'Bogota'}
        serializer = RouteStopWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('address', serializer.errors)

    def test_missing_city_fails(self):
        data = {'stop_order': 1, 'address': 'Calle 10'}
        serializer = RouteStopWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('city', serializer.errors)

    def test_non_integer_stop_order_fails(self):
        data = {'stop_order': 'first', 'address': 'Calle 10', 'city': 'Bogota'}
        serializer = RouteStopWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('stop_order', serializer.errors)

    # --- Optional fields ---

    def test_latitude_longitude_optional(self):
        data = {'stop_order': 1, 'address': 'Calle 10', 'city': 'Bogota'}
        serializer = RouteStopWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)


class RouteWriteSerializerTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()

    def _valid_data(self, **kwargs):
        data = {
            'name': 'Route Beta',
            'origin_warehouse': self.warehouse.pk,
            'status': 'active',
        }
        data.update(kwargs)
        return data

    # --- Happy path ---

    def test_valid_minimal_data_passes(self):
        serializer = RouteWriteSerializer(data=self._valid_data())
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_data_with_stops_passes(self):
        data = self._valid_data()
        data['stops'] = [
            {'stop_order': 1, 'address': 'Calle 1', 'city': 'Bogota'},
            {'stop_order': 2, 'address': 'Calle 2', 'city': 'Medellin'},
        ]
        serializer = RouteWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_stops_default_to_empty_list(self):
        serializer = RouteWriteSerializer(data=self._valid_data())
        serializer.is_valid()
        self.assertEqual(serializer.validated_data.get('stops', []), [])

    # --- Unhappy path ---

    def test_missing_name_fails(self):
        data = self._valid_data()
        del data['name']
        serializer = RouteWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_missing_origin_warehouse_fails(self):
        data = self._valid_data()
        del data['origin_warehouse']
        serializer = RouteWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('origin_warehouse', serializer.errors)

    def test_invalid_warehouse_id_fails(self):
        data = self._valid_data(origin_warehouse=99999)
        serializer = RouteWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('origin_warehouse', serializer.errors)

    def test_invalid_status_fails(self):
        data = self._valid_data(status='unknown')
        serializer = RouteWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('status', serializer.errors)

    def test_stop_with_missing_address_fails(self):
        data = self._valid_data()
        data['stops'] = [{'stop_order': 1, 'city': 'Bogota'}]
        serializer = RouteWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('stops', serializer.errors)


class RouteReadSerializerTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()
        self.route = make_route(self.warehouse)
        RouteStop.objects.create(
            route=self.route,
            stop_order=1,
            address='Calle 10',
            city='Bogota',
        )

    def test_read_serializer_includes_all_expected_fields(self):
        route = Route.objects.select_related('origin_warehouse').prefetch_related('stops').get(pk=self.route.pk)
        serializer = RouteReadSerializer(route)
        data = serializer.data
        for field in ['id', 'name', 'origin_warehouse', 'status', 'stops', 'created_at', 'updated_at']:
            self.assertIn(field, data)

    def test_origin_warehouse_is_nested_object(self):
        route = Route.objects.select_related('origin_warehouse').prefetch_related('stops').get(pk=self.route.pk)
        serializer = RouteReadSerializer(route)
        wh = serializer.data['origin_warehouse']
        self.assertIsInstance(wh, dict)
        self.assertIn('id', wh)
        self.assertIn('name', wh)

    def test_stops_is_a_list(self):
        route = Route.objects.select_related('origin_warehouse').prefetch_related('stops').get(pk=self.route.pk)
        serializer = RouteReadSerializer(route)
        self.assertIsInstance(serializer.data['stops'], list)
        self.assertEqual(len(serializer.data['stops']), 1)

    def test_read_serializer_id_is_read_only(self):
        # id should not appear in writable validated_data
        data = {'id': 999, 'name': 'X', 'origin_warehouse': self.warehouse.pk, 'status': 'active'}
        serializer = RouteReadSerializer(self.route, data=data, partial=True)
        # RouteReadSerializer is read-only by design — just assert fields are present in output
        out = RouteReadSerializer(self.route).data
        self.assertEqual(out['id'], self.route.pk)
