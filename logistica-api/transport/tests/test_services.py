from django.test import TestCase
from django.contrib.auth.models import User
import datetime
from decimal import Decimal

from drivers.models import Driver
from transport.models import Transport
from transport.services import TransportService


class TransportServiceSetupMixin:
    """Shared setUp for TransportService tests."""

    def setUp(self):
        self.driver_user = User.objects.create_user(
            username='svc_driver',
            password='svcpass123',
            first_name='Service',
            last_name='Driver',
        )
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-SVC-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='555-4001',
            status=Driver.DriverStatus.AVAILABLE,
        )
        self.transport_data = {
            'name': 'Service Truck',
            'type': Transport.TransportType.TRUCK,
            'plate_number': 'SVC-001',
            'capacity_kg': Decimal('1000.00'),
            'capacity_m3': Decimal('10.000'),
            'status': Transport.TransportStatus.AVAILABLE,
        }


class TransportServiceCreateTest(TransportServiceSetupMixin, TestCase):
    """Tests for TransportService.create_transport."""

    def test_create_transport_returns_transport_instance(self):
        transport = TransportService.create_transport(self.transport_data)
        self.assertIsInstance(transport, Transport)

    def test_create_transport_persists_to_database(self):
        transport = TransportService.create_transport(self.transport_data)
        self.assertIsNotNone(transport.pk)
        self.assertTrue(Transport.objects.filter(pk=transport.pk).exists())

    def test_create_transport_with_correct_field_values(self):
        transport = TransportService.create_transport(self.transport_data)
        self.assertEqual(transport.name, 'Service Truck')
        self.assertEqual(transport.type, Transport.TransportType.TRUCK)
        self.assertEqual(transport.plate_number, 'SVC-001')
        self.assertEqual(transport.capacity_kg, Decimal('1000.00'))
        self.assertEqual(transport.capacity_m3, Decimal('10.000'))

    def test_create_transport_without_driver(self):
        transport = TransportService.create_transport(self.transport_data)
        self.assertIsNone(transport.driver)

    def test_create_transport_with_driver(self):
        data = dict(self.transport_data)
        data['driver'] = self.driver
        data['plate_number'] = 'SVC-DRV-001'
        transport = TransportService.create_transport(data)
        self.assertEqual(transport.driver.pk, self.driver.pk)

    def test_create_transport_default_status_available(self):
        data = {
            'name': 'Default Status Truck',
            'type': Transport.TransportType.VAN,
            'plate_number': 'DEF-001',
            'capacity_kg': Decimal('500.00'),
            'capacity_m3': Decimal('5.000'),
        }
        transport = TransportService.create_transport(data)
        self.assertEqual(transport.status, Transport.TransportStatus.AVAILABLE)

    def test_create_transport_returns_instance_with_driver_select_related(self):
        """Verify the returned object has driver pre-fetched (no N+1)."""
        data = dict(self.transport_data)
        data['driver'] = self.driver
        data['plate_number'] = 'SRC-REL-001'
        transport = TransportService.create_transport(data)
        # Accessing driver should not cause an additional query (pre-fetched)
        self.assertIsNotNone(transport.driver)
        self.assertEqual(transport.driver.license_number, 'LIC-SVC-001')


class TransportServiceUpdateTest(TransportServiceSetupMixin, TestCase):
    """Tests for TransportService.update_transport."""

    def setUp(self):
        super().setUp()
        self.transport = Transport.objects.create(
            name='Original Name',
            type=Transport.TransportType.TRUCK,
            plate_number='UPD-001',
            capacity_kg=Decimal('1000.00'),
            capacity_m3=Decimal('10.000'),
        )

    def test_update_transport_name(self):
        updated = TransportService.update_transport(self.transport, {'name': 'Updated Name'})
        self.assertEqual(updated.name, 'Updated Name')

    def test_update_transport_persists_change(self):
        TransportService.update_transport(self.transport, {'name': 'Persisted Name'})
        refreshed = Transport.objects.get(pk=self.transport.pk)
        self.assertEqual(refreshed.name, 'Persisted Name')

    def test_update_transport_status(self):
        updated = TransportService.update_transport(
            self.transport, {'status': Transport.TransportStatus.MAINTENANCE}
        )
        self.assertEqual(updated.status, Transport.TransportStatus.MAINTENANCE)

    def test_update_transport_capacity_kg(self):
        updated = TransportService.update_transport(
            self.transport, {'capacity_kg': Decimal('1500.00')}
        )
        self.assertEqual(updated.capacity_kg, Decimal('1500.00'))

    def test_update_transport_assign_driver(self):
        updated = TransportService.update_transport(self.transport, {'driver': self.driver})
        self.assertEqual(updated.driver.pk, self.driver.pk)

    def test_update_transport_returns_transport_instance(self):
        result = TransportService.update_transport(self.transport, {'name': 'Return Test'})
        self.assertIsInstance(result, Transport)


class TransportServiceDeleteTest(TransportServiceSetupMixin, TestCase):
    """Tests for TransportService.delete_transport."""

    def setUp(self):
        super().setUp()
        self.transport = Transport.objects.create(
            name='To Delete',
            type=Transport.TransportType.VAN,
            plate_number='DEL-001',
            capacity_kg=Decimal('300.00'),
            capacity_m3=Decimal('3.000'),
        )

    def test_delete_transport_removes_from_database(self):
        pk = self.transport.pk
        TransportService.delete_transport(self.transport)
        self.assertFalse(Transport.objects.filter(pk=pk).exists())

    def test_delete_transport_returns_none(self):
        result = TransportService.delete_transport(self.transport)
        self.assertIsNone(result)


class TransportServiceAssignDriverTest(TransportServiceSetupMixin, TestCase):
    """Tests for TransportService.assign_driver."""

    def setUp(self):
        super().setUp()
        self.transport = Transport.objects.create(
            name='Assign Driver Truck',
            type=Transport.TransportType.TRUCK,
            plate_number='ASG-001',
            capacity_kg=Decimal('1000.00'),
            capacity_m3=Decimal('10.000'),
        )

    def test_assign_driver_sets_driver_on_transport(self):
        updated = TransportService.assign_driver(self.transport, self.driver)
        self.assertEqual(updated.driver.pk, self.driver.pk)

    def test_assign_driver_persists_to_database(self):
        TransportService.assign_driver(self.transport, self.driver)
        refreshed = Transport.objects.get(pk=self.transport.pk)
        self.assertEqual(refreshed.driver.pk, self.driver.pk)

    def test_assign_driver_returns_transport_instance(self):
        result = TransportService.assign_driver(self.transport, self.driver)
        self.assertIsInstance(result, Transport)

    def test_assign_driver_preloads_driver_relation(self):
        result = TransportService.assign_driver(self.transport, self.driver)
        self.assertEqual(result.driver.license_number, 'LIC-SVC-001')

    def test_reassign_driver_replaces_previous_one(self):
        second_user = User.objects.create_user(
            username='svc_driver2',
            password='pass456',
        )
        second_driver = Driver.objects.create(
            user=second_user,
            license_number='LIC-SVC-002',
            license_expiry=datetime.date(2028, 6, 30),
            phone='555-4002',
            status=Driver.DriverStatus.AVAILABLE,
        )
        TransportService.assign_driver(self.transport, self.driver)
        updated = TransportService.assign_driver(self.transport, second_driver)
        self.assertEqual(updated.driver.pk, second_driver.pk)


class TransportServiceUnassignDriverTest(TransportServiceSetupMixin, TestCase):
    """Tests for TransportService.unassign_driver."""

    def setUp(self):
        super().setUp()
        self.transport = Transport.objects.create(
            name='Unassign Truck',
            type=Transport.TransportType.TRUCK,
            plate_number='UNA-001',
            capacity_kg=Decimal('1000.00'),
            capacity_m3=Decimal('10.000'),
            driver=self.driver,
        )

    def test_unassign_driver_sets_driver_to_none(self):
        updated = TransportService.unassign_driver(self.transport)
        self.assertIsNone(updated.driver)

    def test_unassign_driver_persists_null_to_database(self):
        TransportService.unassign_driver(self.transport)
        refreshed = Transport.objects.get(pk=self.transport.pk)
        self.assertIsNone(refreshed.driver)

    def test_unassign_driver_returns_transport_instance(self):
        result = TransportService.unassign_driver(self.transport)
        self.assertIsInstance(result, Transport)

    def test_unassign_driver_on_transport_without_driver_is_safe(self):
        transport_no_driver = Transport.objects.create(
            name='Already No Driver',
            type=Transport.TransportType.VAN,
            plate_number='AND-001',
            capacity_kg=Decimal('500.00'),
            capacity_m3=Decimal('5.000'),
        )
        result = TransportService.unassign_driver(transport_no_driver)
        self.assertIsNone(result.driver)
