from django.test import TestCase
from django.contrib.auth.models import User
from django.db import IntegrityError
import datetime
from decimal import Decimal

from drivers.models import Driver
from transport.models import Transport


class TransportModelCreationTest(TestCase):
    """Tests for creating Transport instances with valid data."""

    def setUp(self):
        self.driver_user = User.objects.create_user(
            username='driveruser',
            password='driverpass123',
            first_name='John',
            last_name='Doe',
        )
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='555-0001',
            status=Driver.DriverStatus.AVAILABLE,
        )

    def test_create_transport_with_all_required_fields(self):
        transport = Transport.objects.create(
            name='Truck Alpha',
            type=Transport.TransportType.TRUCK,
            plate_number='ABC-123',
            capacity_kg=Decimal('1000.00'),
            capacity_m3=Decimal('10.000'),
        )
        self.assertEqual(transport.name, 'Truck Alpha')
        self.assertEqual(transport.type, Transport.TransportType.TRUCK)
        self.assertEqual(transport.plate_number, 'ABC-123')
        self.assertEqual(transport.capacity_kg, Decimal('1000.00'))
        self.assertEqual(transport.capacity_m3, Decimal('10.000'))
        self.assertIsNone(transport.driver)

    def test_default_status_is_available(self):
        transport = Transport.objects.create(
            name='Van Beta',
            type=Transport.TransportType.VAN,
            plate_number='VAN-001',
            capacity_kg=Decimal('500.00'),
            capacity_m3=Decimal('5.000'),
        )
        self.assertEqual(transport.status, Transport.TransportStatus.AVAILABLE)

    def test_create_transport_with_driver(self):
        transport = Transport.objects.create(
            name='Moto Gamma',
            type=Transport.TransportType.MOTORCYCLE,
            plate_number='MOT-001',
            capacity_kg=Decimal('50.00'),
            capacity_m3=Decimal('0.200'),
            driver=self.driver,
        )
        self.assertEqual(transport.driver, self.driver)

    def test_create_transport_driver_nullable(self):
        transport = Transport.objects.create(
            name='Bicycle Delta',
            type=Transport.TransportType.BICYCLE,
            plate_number='BIC-001',
            capacity_kg=Decimal('20.00'),
            capacity_m3=Decimal('0.100'),
            driver=None,
        )
        self.assertIsNone(transport.driver)

    def test_all_transport_types_valid(self):
        types = [
            Transport.TransportType.TRUCK,
            Transport.TransportType.VAN,
            Transport.TransportType.MOTORCYCLE,
            Transport.TransportType.BICYCLE,
        ]
        for i, t_type in enumerate(types):
            transport = Transport.objects.create(
                name=f'Vehicle {i}',
                type=t_type,
                plate_number=f'PLT-00{i}',
                capacity_kg=Decimal('100.00'),
                capacity_m3=Decimal('1.000'),
            )
            self.assertEqual(transport.type, t_type)

    def test_all_transport_statuses_valid(self):
        statuses = [
            Transport.TransportStatus.AVAILABLE,
            Transport.TransportStatus.IN_TRANSIT,
            Transport.TransportStatus.MAINTENANCE,
        ]
        for i, t_status in enumerate(statuses):
            transport = Transport.objects.create(
                name=f'Status Vehicle {i}',
                type=Transport.TransportType.VAN,
                plate_number=f'STS-00{i}',
                capacity_kg=Decimal('100.00'),
                capacity_m3=Decimal('1.000'),
                status=t_status,
            )
            self.assertEqual(transport.status, t_status)

    def test_created_at_and_updated_at_auto_set(self):
        transport = Transport.objects.create(
            name='Auto Timestamps',
            type=Transport.TransportType.TRUCK,
            plate_number='ATS-001',
            capacity_kg=Decimal('800.00'),
            capacity_m3=Decimal('8.000'),
        )
        self.assertIsNotNone(transport.created_at)
        self.assertIsNotNone(transport.updated_at)


class TransportModelConstraintsTest(TestCase):
    """Tests for model-level constraints."""

    def setUp(self):
        Transport.objects.create(
            name='Existing Truck',
            type=Transport.TransportType.TRUCK,
            plate_number='DUP-123',
            capacity_kg=Decimal('1000.00'),
            capacity_m3=Decimal('10.000'),
        )

    def test_plate_number_must_be_unique(self):
        with self.assertRaises(IntegrityError):
            Transport.objects.create(
                name='Duplicate Truck',
                type=Transport.TransportType.VAN,
                plate_number='DUP-123',
                capacity_kg=Decimal('500.00'),
                capacity_m3=Decimal('5.000'),
            )

    def test_meta_ordering_is_by_created_at_descending(self):
        meta_ordering = Transport._meta.ordering
        self.assertEqual(meta_ordering, ['-created_at'])


class TransportModelStrTest(TestCase):
    """Tests for __str__ method."""

    def test_str_returns_name_and_plate_number(self):
        transport = Transport.objects.create(
            name='Main Truck',
            type=Transport.TransportType.TRUCK,
            plate_number='STR-001',
            capacity_kg=Decimal('1000.00'),
            capacity_m3=Decimal('10.000'),
        )
        self.assertEqual(str(transport), 'Main Truck (STR-001)')


class TransportModelSetNullOnDeleteTest(TestCase):
    """Tests for SET_NULL behavior when Driver is deleted."""

    def setUp(self):
        self.driver_user = User.objects.create_user(
            username='driverfordelete',
            password='pass123',
            first_name='Jane',
            last_name='Smith',
        )
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-DEL-001',
            license_expiry=datetime.date(2027, 6, 30),
            phone='555-0002',
            status=Driver.DriverStatus.AVAILABLE,
        )
        self.transport = Transport.objects.create(
            name='Assigned Truck',
            type=Transport.TransportType.TRUCK,
            plate_number='ASN-001',
            capacity_kg=Decimal('1200.00'),
            capacity_m3=Decimal('12.000'),
            driver=self.driver,
        )

    def test_driver_delete_sets_transport_driver_to_null(self):
        self.assertEqual(self.transport.driver, self.driver)
        self.driver.delete()
        self.transport.refresh_from_db()
        self.assertIsNone(self.transport.driver)
