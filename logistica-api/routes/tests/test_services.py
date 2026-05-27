from django.test import TestCase
from rest_framework.exceptions import ValidationError

from warehouses.models import Warehouse
from routes.models import Route, RouteStop
from routes.services import RouteService


def make_warehouse(**kwargs):
    defaults = {
        'name': 'Service Warehouse',
        'address': 'Av. El Dorado',
        'city': 'Bogota',
        'country': 'Colombia',
    }
    defaults.update(kwargs)
    return Warehouse.objects.create(**defaults)


def make_route(warehouse, **kwargs):
    defaults = {
        'name': 'Service Route',
        'origin_warehouse': warehouse,
        'status': 'active',
    }
    defaults.update(kwargs)
    return Route.objects.create(**defaults)


class RouteServiceCreateTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()

    # --- Happy path ---

    def test_create_route_without_stops(self):
        data = {'name': 'Route 1', 'origin_warehouse': self.warehouse, 'status': 'active', 'stops': []}
        route = RouteService.create_route(data)
        self.assertIsInstance(route, Route)
        self.assertEqual(route.name, 'Route 1')
        self.assertEqual(Route.objects.count(), 1)

    def test_create_route_with_stops(self):
        data = {
            'name': 'Route 2',
            'origin_warehouse': self.warehouse,
            'status': 'active',
            'stops': [
                {'stop_order': 1, 'address': 'Calle 10', 'city': 'Bogota'},
                {'stop_order': 2, 'address': 'Calle 20', 'city': 'Medellin'},
            ],
        }
        route = RouteService.create_route(data)
        self.assertEqual(RouteStop.objects.filter(route=route).count(), 2)

    def test_create_route_returns_instance_with_related_data(self):
        data = {
            'name': 'Route 3',
            'origin_warehouse': self.warehouse,
            'stops': [{'stop_order': 1, 'address': 'Av 1', 'city': 'Cali'}],
        }
        route = RouteService.create_route(data)
        # origin_warehouse should be pre-selected
        self.assertEqual(route.origin_warehouse.pk, self.warehouse.pk)
        # stops prefetched
        self.assertEqual(len(route.stops.all()), 1)

    def test_create_route_without_stops_key_defaults_empty(self):
        data = {'name': 'Route No Stops', 'origin_warehouse': self.warehouse}
        route = RouteService.create_route(data)
        self.assertEqual(RouteStop.objects.filter(route=route).count(), 0)

    def test_create_route_atomic_rollback_on_duplicate_stop_order(self):
        """If two stops have the same order, nothing should be persisted."""
        data = {
            'name': 'Route Dup',
            'origin_warehouse': self.warehouse,
            'stops': [
                {'stop_order': 1, 'address': 'X', 'city': 'A'},
                {'stop_order': 1, 'address': 'Y', 'city': 'B'},
            ],
        }
        with self.assertRaises(Exception):
            RouteService.create_route(data)
        # Route should not exist because of atomic rollback
        self.assertEqual(Route.objects.filter(name='Route Dup').count(), 0)


class RouteServiceUpdateTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()
        self.route = make_route(self.warehouse)
        RouteStop.objects.create(route=self.route, stop_order=1, address='Old Addr', city='Old City')

    # --- Happy path ---

    def test_update_route_name(self):
        updated = RouteService.update_route(self.route, {'name': 'Updated Name'})
        self.assertEqual(updated.name, 'Updated Name')

    def test_update_route_status(self):
        updated = RouteService.update_route(self.route, {'status': 'inactive'})
        self.assertEqual(updated.status, 'inactive')

    def test_update_route_replaces_stops_when_provided(self):
        new_stops = [
            {'stop_order': 1, 'address': 'New Addr 1', 'city': 'New City 1'},
            {'stop_order': 2, 'address': 'New Addr 2', 'city': 'New City 2'},
        ]
        updated = RouteService.update_route(self.route, {'stops': new_stops})
        stops = list(RouteStop.objects.filter(route=updated).order_by('stop_order'))
        self.assertEqual(len(stops), 2)
        self.assertEqual(stops[0].city, 'New City 1')

    def test_update_route_preserves_stops_when_not_provided(self):
        RouteService.update_route(self.route, {'name': 'Only Name Change'})
        self.assertEqual(RouteStop.objects.filter(route=self.route).count(), 1)

    def test_update_route_clears_stops_when_provided_empty_list(self):
        updated = RouteService.update_route(self.route, {'stops': []})
        self.assertEqual(RouteStop.objects.filter(route=updated).count(), 0)

    def test_update_returns_refreshed_instance(self):
        updated = RouteService.update_route(self.route, {'name': 'Refreshed'})
        self.assertIsInstance(updated, Route)
        self.assertEqual(updated.name, 'Refreshed')


class RouteServiceDeleteTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()
        self.route = make_route(self.warehouse)

    def test_delete_route_removes_from_db(self):
        pk = self.route.pk
        RouteService.delete_route(self.route)
        self.assertFalse(Route.objects.filter(pk=pk).exists())

    def test_delete_route_cascades_stops(self):
        RouteStop.objects.create(route=self.route, stop_order=1, address='X', city='Y')
        pk = self.route.pk
        RouteService.delete_route(self.route)
        self.assertEqual(RouteStop.objects.filter(route_id=pk).count(), 0)


class RouteServiceAddStopTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()
        self.route = make_route(self.warehouse)

    # --- Happy path ---

    def test_add_stop_creates_instance(self):
        stop = RouteService.add_stop(self.route, {'stop_order': 1, 'address': 'Calle 1', 'city': 'Bogota'})
        self.assertIsInstance(stop, RouteStop)
        self.assertEqual(stop.route, self.route)

    def test_add_multiple_stops_different_orders(self):
        RouteService.add_stop(self.route, {'stop_order': 1, 'address': 'A', 'city': 'X'})
        RouteService.add_stop(self.route, {'stop_order': 2, 'address': 'B', 'city': 'Y'})
        self.assertEqual(RouteStop.objects.filter(route=self.route).count(), 2)

    # --- Unhappy path: duplicate stop_order ---

    def test_add_stop_duplicate_order_raises_validation_error(self):
        RouteService.add_stop(self.route, {'stop_order': 1, 'address': 'A', 'city': 'X'})
        with self.assertRaises(ValidationError):
            RouteService.add_stop(self.route, {'stop_order': 1, 'address': 'B', 'city': 'Y'})

    # --- Edge case: optional fields ---

    def test_add_stop_with_coordinates(self):
        stop = RouteService.add_stop(
            self.route,
            {'stop_order': 1, 'address': 'Av 1', 'city': 'Cali', 'latitude': '3.4516', 'longitude': '-76.5320'},
        )
        self.assertIsNotNone(stop.latitude)

    def test_add_stop_without_coordinates(self):
        stop = RouteService.add_stop(self.route, {'stop_order': 1, 'address': 'Av 1', 'city': 'Cali'})
        self.assertIsNone(stop.latitude)
        self.assertIsNone(stop.longitude)


class RouteServiceDeleteStopTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()
        self.route = make_route(self.warehouse)
        self.stop = RouteStop.objects.create(
            route=self.route, stop_order=1, address='Calle 5', city='Bogota'
        )

    def test_delete_stop_removes_from_db(self):
        RouteService.delete_stop(self.route, self.stop.pk)
        self.assertFalse(RouteStop.objects.filter(pk=self.stop.pk).exists())

    def test_delete_stop_with_wrong_pk_raises_404(self):
        from django.http import Http404
        with self.assertRaises(Http404):
            RouteService.delete_stop(self.route, 99999)

    def test_delete_stop_from_wrong_route_raises_404(self):
        from django.http import Http404
        other_route = make_route(self.warehouse, name='Other Route')
        with self.assertRaises(Http404):
            RouteService.delete_stop(other_route, self.stop.pk)


class RouteServiceListStopsTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()
        self.route = make_route(self.warehouse)

    def test_list_stops_returns_queryset(self):
        RouteStop.objects.create(route=self.route, stop_order=1, address='A', city='B')
        RouteStop.objects.create(route=self.route, stop_order=2, address='C', city='D')
        stops = RouteService.list_stops(self.route)
        self.assertEqual(stops.count(), 2)

    def test_list_stops_empty_route(self):
        stops = RouteService.list_stops(self.route)
        self.assertEqual(stops.count(), 0)

    def test_list_stops_ordered_by_stop_order(self):
        RouteStop.objects.create(route=self.route, stop_order=3, address='Z', city='Z')
        RouteStop.objects.create(route=self.route, stop_order=1, address='A', city='A')
        stops = list(RouteService.list_stops(self.route).values_list('stop_order', flat=True))
        self.assertEqual(stops, [1, 3])
