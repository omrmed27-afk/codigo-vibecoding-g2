from django.test import TestCase
from django.contrib.auth.models import User
import datetime
from decimal import Decimal

from drivers.models import Driver
from transport.models import Transport
from transport.serializers import (
    TransportReadSerializer,
    TransportWriteSerializer,
    DriverSummarySerializer,
)


class DriverSummarySerializerTest(TestCase):
    """Tests for the DriverSummarySerializer used in nested read output."""

    def setUp(self):
        self.driver_user = User.objects.create_user(
            username='driveruser',
            password='driverpass123',
            first_name='John',
            last_name='Doe',
        )
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-SER-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='555-1001',
            status=Driver.DriverStatus.AVAILABLE,
        )

    def test_driver_summary_serializer_contains_expected_fields(self):
        serializer = DriverSummarySerializer(self.driver)
        data = serializer.data
        self.assertIn('id', data)
        self.assertIn('license_number', data)
        self.assertIn('phone', data)
        self.assertIn('status', data)

    def test_driver_summary_serializer_values(self):
        serializer = DriverSummarySerializer(self.driver)
        data = serializer.data
        self.assertEqual(data['license_number'], 'LIC-SER-001')
        self.assertEqual(data['phone'], '555-1001')
        self.assertEqual(data['status'], Driver.DriverStatus.AVAILABLE)


class TransportReadSerializerTest(TestCase):
    """Tests for TransportReadSerializer output structure."""

    def setUp(self):
        self.driver_user = User.objects.create_user(
            username='driverread',
            password='readpass123',
        )
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-READ-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='555-2001',
            status=Driver.DriverStatus.AVAILABLE,
        )
        self.transport = Transport.objects.create(
            name='Read Truck',
            type=Transport.TransportType.TRUCK,
            plate_number='READ-001',
            capacity_kg=Decimal('1000.00'),
            capacity_m3=Decimal('10.000'),
            driver=self.driver,
        )
        self.transport_no_driver = Transport.objects.create(
            name='No Driver Van',
            type=Transport.TransportType.VAN,
            plate_number='NOD-001',
            capacity_kg=Decimal('500.00'),
            capacity_m3=Decimal('5.000'),
        )

    def test_read_serializer_contains_all_fields(self):
        serializer = TransportReadSerializer(self.transport)
        data = serializer.data
        expected_fields = ['id', 'name', 'type', 'plate_number', 'capacity_kg',
                           'capacity_m3', 'driver', 'status', 'created_at', 'updated_at']
        for field in expected_fields:
            self.assertIn(field, data)

    def test_read_serializer_driver_is_nested_object(self):
        serializer = TransportReadSerializer(self.transport)
        data = serializer.data
        self.assertIsInstance(data['driver'], dict)
        self.assertIn('license_number', data['driver'])

    def test_read_serializer_driver_is_null_when_unassigned(self):
        serializer = TransportReadSerializer(self.transport_no_driver)
        data = serializer.data
        self.assertIsNone(data['driver'])

    def test_read_serializer_id_is_read_only(self):
        # id field should not be writable; read_only_fields includes 'id'
        serializer = TransportReadSerializer(self.transport)
        self.assertIn('id', serializer.fields)
        self.assertTrue(serializer.fields['id'].read_only)

    def test_read_serializer_created_at_is_read_only(self):
        serializer = TransportReadSerializer(self.transport)
        self.assertTrue(serializer.fields['created_at'].read_only)

    def test_read_serializer_updated_at_is_read_only(self):
        serializer = TransportReadSerializer(self.transport)
        self.assertTrue(serializer.fields['updated_at'].read_only)


class TransportWriteSerializerHappyPathTest(TestCase):
    """Happy path tests for TransportWriteSerializer."""

    def setUp(self):
        self.driver_user = User.objects.create_user(
            username='driverwrite',
            password='writepass123',
        )
        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='LIC-WRI-001',
            license_expiry=datetime.date(2027, 12, 31),
            phone='555-3001',
            status=Driver.DriverStatus.AVAILABLE,
        )

    def test_valid_data_is_valid(self):
        data = {
            'name': 'New Truck',
            'type': 'truck',
            'plate_number': 'NEW-001',
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
            'status': 'available',
        }
        serializer = TransportWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_data_with_driver(self):
        data = {
            'name': 'Driver Truck',
            'type': 'truck',
            'plate_number': 'DRV-002',
            'capacity_kg': '800.00',
            'capacity_m3': '8.000',
            'driver': self.driver.pk,
        }
        serializer = TransportWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_driver_is_optional(self):
        data = {
            'name': 'No Driver Truck',
            'type': 'van',
            'plate_number': 'NDR-001',
            'capacity_kg': '300.00',
            'capacity_m3': '3.000',
        }
        serializer = TransportWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_driver_can_be_null(self):
        data = {
            'name': 'Null Driver Truck',
            'type': 'motorcycle',
            'plate_number': 'NUL-001',
            'capacity_kg': '50.00',
            'capacity_m3': '0.200',
            'driver': None,
        }
        serializer = TransportWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_all_transport_types_accepted(self):
        for i, t_type in enumerate(['truck', 'van', 'motorcycle', 'bicycle']):
            data = {
                'name': f'Type Test {i}',
                'type': t_type,
                'plate_number': f'TYP-00{i}',
                'capacity_kg': '100.00',
                'capacity_m3': '1.000',
            }
            serializer = TransportWriteSerializer(data=data)
            self.assertTrue(serializer.is_valid(), f"Failed for type {t_type}: {serializer.errors}")

    def test_all_statuses_accepted(self):
        for i, t_status in enumerate(['available', 'in_transit', 'maintenance']):
            data = {
                'name': f'Status Test {i}',
                'type': 'van',
                'plate_number': f'STA-00{i}',
                'capacity_kg': '100.00',
                'capacity_m3': '1.000',
                'status': t_status,
            }
            serializer = TransportWriteSerializer(data=data)
            self.assertTrue(serializer.is_valid(), f"Failed for status {t_status}: {serializer.errors}")


class TransportWriteSerializerUnhappyPathTest(TestCase):
    """Unhappy path tests for TransportWriteSerializer."""

    def test_missing_name_fails(self):
        data = {
            'type': 'truck',
            'plate_number': 'MIS-001',
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
        }
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_missing_type_fails(self):
        data = {
            'name': 'No Type Truck',
            'plate_number': 'NTP-001',
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
        }
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('type', serializer.errors)

    def test_missing_plate_number_fails(self):
        data = {
            'name': 'No Plate Truck',
            'type': 'truck',
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
        }
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('plate_number', serializer.errors)

    def test_missing_capacity_kg_fails(self):
        data = {
            'name': 'No Capacity Truck',
            'type': 'truck',
            'plate_number': 'NCP-001',
            'capacity_m3': '10.000',
        }
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('capacity_kg', serializer.errors)

    def test_missing_capacity_m3_fails(self):
        data = {
            'name': 'No Capacity M3 Truck',
            'type': 'truck',
            'plate_number': 'NCM-001',
            'capacity_kg': '1000.00',
        }
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('capacity_m3', serializer.errors)

    def test_invalid_type_choice_fails(self):
        data = {
            'name': 'Bad Type Truck',
            'type': 'airplane',
            'plate_number': 'BAD-001',
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
        }
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('type', serializer.errors)

    def test_invalid_status_choice_fails(self):
        data = {
            'name': 'Bad Status Truck',
            'type': 'truck',
            'plate_number': 'BST-001',
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
            'status': 'flying',
        }
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('status', serializer.errors)

    def test_invalid_capacity_kg_type_fails(self):
        data = {
            'name': 'Bad Capacity Truck',
            'type': 'truck',
            'plate_number': 'BCK-001',
            'capacity_kg': 'not-a-number',
            'capacity_m3': '10.000',
        }
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('capacity_kg', serializer.errors)

    def test_invalid_driver_pk_fails(self):
        data = {
            'name': 'Bad Driver Truck',
            'type': 'truck',
            'plate_number': 'BDR-001',
            'capacity_kg': '1000.00',
            'capacity_m3': '10.000',
            'driver': 9999,
        }
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('driver', serializer.errors)


class TransportWriteSerializerPlateUniqueValidationTest(TestCase):
    """Tests for the custom validate_plate_number validator."""

    def setUp(self):
        self.existing = Transport.objects.create(
            name='Existing Transport',
            type=Transport.TransportType.TRUCK,
            plate_number='EXIST-001',
            capacity_kg=Decimal('1000.00'),
            capacity_m3=Decimal('10.000'),
        )

    def test_duplicate_plate_number_on_create_fails(self):
        data = {
            'name': 'Duplicate',
            'type': 'van',
            'plate_number': 'EXIST-001',
            'capacity_kg': '500.00',
            'capacity_m3': '5.000',
        }
        serializer = TransportWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('plate_number', serializer.errors)

    def test_same_plate_number_on_update_is_valid(self):
        """Updating an instance with its own plate_number should not raise a duplicate error."""
        data = {
            'name': 'Updated Name',
            'type': 'truck',
            'plate_number': 'EXIST-001',
            'capacity_kg': '1200.00',
            'capacity_m3': '12.000',
        }
        serializer = TransportWriteSerializer(instance=self.existing, data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_different_plate_number_on_update_is_valid(self):
        data = {
            'name': 'Updated Name',
            'type': 'truck',
            'plate_number': 'NEW-PLATE-002',
            'capacity_kg': '1200.00',
            'capacity_m3': '12.000',
        }
        serializer = TransportWriteSerializer(instance=self.existing, data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
