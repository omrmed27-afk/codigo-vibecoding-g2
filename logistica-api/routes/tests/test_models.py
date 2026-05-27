from django.test import TestCase
from django.db import IntegrityError

from warehouses.models import Warehouse
from routes.models import Route, RouteStop


def make_warehouse(**kwargs):
    defaults = {
        'name': 'Main Warehouse',
        'address': 'Calle 1 # 2-3',
        'city': 'Bogota',
        'country': 'Colombia',
    }
    defaults.update(kwargs)
    return Warehouse.objects.create(**defaults)


def make_route(warehouse, **kwargs):
    defaults = {
        'name': 'Route A',
        'origin_warehouse': warehouse,
    }
    defaults.update(kwargs)
    return Route.objects.create(**defaults)


class RouteModelTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()

    # --- Creation ---

    def test_create_route_with_required_fields(self):
        route = make_route(self.warehouse)
        self.assertIsNotNone(route.pk)
        self.assertEqual(route.name, 'Route A')
        self.assertEqual(route.origin_warehouse, self.warehouse)

    def test_status_defaults_to_active(self):
        route = make_route(self.warehouse)
        self.assertEqual(route.status, Route.RouteStatus.ACTIVE)

    def test_create_route_with_inactive_status(self):
        route = make_route(self.warehouse, status=Route.RouteStatus.INACTIVE)
        self.assertEqual(route.status, Route.RouteStatus.INACTIVE)

    # --- __str__ ---

    def test_str_returns_name(self):
        route = make_route(self.warehouse, name='Northern Route')
        self.assertEqual(str(route), 'Northern Route')

    # --- Timestamps ---

    def test_created_at_is_set_automatically(self):
        route = make_route(self.warehouse)
        self.assertIsNotNone(route.created_at)

    def test_updated_at_is_set_automatically(self):
        route = make_route(self.warehouse)
        self.assertIsNotNone(route.updated_at)

    # --- Meta ordering ---

    def test_meta_ordering_is_by_created_at_descending(self):
        self.assertEqual(Route._meta.ordering, ['-created_at'])

    # --- FK on_delete PROTECT ---

    def test_delete_warehouse_with_routes_raises_error(self):
        make_route(self.warehouse)
        with self.assertRaises(Exception):
            self.warehouse.delete()

    # --- Status choices ---

    def test_status_choice_active_value(self):
        self.assertEqual(Route.RouteStatus.ACTIVE, 'active')

    def test_status_choice_inactive_value(self):
        self.assertEqual(Route.RouteStatus.INACTIVE, 'inactive')


class RouteStopModelTest(TestCase):

    def setUp(self):
        self.warehouse = make_warehouse()
        self.route = make_route(self.warehouse)

    def _make_stop(self, stop_order=1, **kwargs):
        defaults = {
            'route': self.route,
            'stop_order': stop_order,
            'address': 'Carrera 10 # 5-20',
            'city': 'Medellin',
        }
        defaults.update(kwargs)
        return RouteStop.objects.create(**defaults)

    # --- Creation ---

    def test_create_stop_with_required_fields(self):
        stop = self._make_stop()
        self.assertIsNotNone(stop.pk)
        self.assertEqual(stop.route, self.route)
        self.assertEqual(stop.stop_order, 1)
        self.assertEqual(stop.city, 'Medellin')

    def test_latitude_and_longitude_nullable(self):
        stop = self._make_stop()
        self.assertIsNone(stop.latitude)
        self.assertIsNone(stop.longitude)

    def test_create_stop_with_coordinates(self):
        stop = self._make_stop(latitude='4.710989', longitude='-74.072090')
        self.assertIsNotNone(stop.latitude)
        self.assertIsNotNone(stop.longitude)

    # --- __str__ ---

    def test_str_returns_stop_order_and_city(self):
        stop = self._make_stop(stop_order=3, city='Cali')
        self.assertEqual(str(stop), 'Stop 3 — Cali')

    # --- unique_together constraint ---

    def test_unique_together_route_and_stop_order(self):
        self._make_stop(stop_order=1)
        with self.assertRaises(IntegrityError):
            self._make_stop(stop_order=1)

    def test_same_stop_order_different_routes_allowed(self):
        route2 = make_route(self.warehouse, name='Route B')
        self._make_stop(stop_order=1)
        stop2 = RouteStop.objects.create(
            route=route2, stop_order=1, address='Av 5', city='Barranquilla'
        )
        self.assertIsNotNone(stop2.pk)

    # --- CASCADE on_delete ---

    def test_delete_route_cascades_to_stops(self):
        self._make_stop(stop_order=1)
        self._make_stop(stop_order=2)
        route_pk = self.route.pk
        self.route.delete()
        self.assertEqual(RouteStop.objects.filter(route_id=route_pk).count(), 0)

    # --- Meta ordering ---

    def test_meta_ordering_is_by_stop_order(self):
        self.assertEqual(RouteStop._meta.ordering, ['stop_order'])

    def test_stops_ordered_by_stop_order(self):
        self._make_stop(stop_order=3)
        self._make_stop(stop_order=1)
        self._make_stop(stop_order=2)
        orders = list(RouteStop.objects.filter(route=self.route).values_list('stop_order', flat=True))
        self.assertEqual(orders, [1, 2, 3])

    # --- Timestamps ---

    def test_created_at_is_set_automatically(self):
        stop = self._make_stop()
        self.assertIsNotNone(stop.created_at)

    # --- related_name ---

    def test_related_name_stops_accessible_from_route(self):
        self._make_stop(stop_order=1)
        self._make_stop(stop_order=2)
        self.assertEqual(self.route.stops.count(), 2)
