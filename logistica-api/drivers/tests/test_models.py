from django.test import TestCase
from django.contrib.auth.models import User
from django.db import IntegrityError

from drivers.models import Driver


class DriverModelCreationTest(TestCase):
    """Tests de creación exitosa del modelo Driver."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='driver_user',
            password='testpass123',
            first_name='Juan',
            last_name='Perez',
            email='juan@example.com',
        )

    def test_create_driver_with_required_fields(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-001',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        self.assertIsNotNone(driver.pk)
        self.assertEqual(driver.user, self.user)
        self.assertEqual(driver.license_number, 'LIC-001')
        self.assertEqual(str(driver.license_expiry), '2027-12-31')
        self.assertEqual(driver.phone, '3001234567')

    def test_default_status_is_available(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-002',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        self.assertEqual(driver.status, Driver.DriverStatus.AVAILABLE)
        self.assertEqual(driver.status, 'available')

    def test_status_choices_are_valid(self):
        choices_values = [c[0] for c in Driver.DriverStatus.choices]
        self.assertIn('available', choices_values)
        self.assertIn('busy', choices_values)
        self.assertIn('off_duty', choices_values)

    def test_str_returns_full_name_and_license(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-003',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        expected = f"Juan Perez (LIC-003)"
        self.assertEqual(str(driver), expected)

    def test_created_at_and_updated_at_auto_set(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-004',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        self.assertIsNotNone(driver.created_at)
        self.assertIsNotNone(driver.updated_at)

    def test_create_driver_with_busy_status(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-005',
            license_expiry='2027-12-31',
            phone='3001234567',
            status=Driver.DriverStatus.BUSY,
        )
        self.assertEqual(driver.status, 'busy')

    def test_create_driver_with_off_duty_status(self):
        driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-006',
            license_expiry='2027-12-31',
            phone='3001234567',
            status=Driver.DriverStatus.OFF_DUTY,
        )
        self.assertEqual(driver.status, 'off_duty')


class DriverModelConstraintsTest(TestCase):
    """Tests de restricciones de integridad del modelo Driver."""

    def setUp(self):
        self.user1 = User.objects.create_user(
            username='driver_user1',
            password='testpass123',
        )
        self.user2 = User.objects.create_user(
            username='driver_user2',
            password='testpass123',
        )

    def test_license_number_unique_constraint(self):
        Driver.objects.create(
            user=self.user1,
            license_number='LIC-DUP',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=self.user2,
                license_number='LIC-DUP',
                license_expiry='2027-12-31',
                phone='3009999999',
            )

    def test_user_onetoone_unique_constraint(self):
        Driver.objects.create(
            user=self.user1,
            license_number='LIC-U01',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                user=self.user1,
                license_number='LIC-U02',
                license_expiry='2027-12-31',
                phone='3009999999',
            )

    def test_meta_ordering_is_by_created_at_desc(self):
        ordering = Driver._meta.ordering
        self.assertEqual(ordering, ['-created_at'])

    def test_meta_verbose_name(self):
        self.assertEqual(Driver._meta.verbose_name, 'Driver')

    def test_meta_verbose_name_plural(self):
        self.assertEqual(Driver._meta.verbose_name_plural, 'Drivers')


class DriverModelCascadeDeleteTest(TestCase):
    """Tests de comportamiento CASCADE al eliminar el User."""

    def test_delete_user_cascades_to_driver(self):
        user = User.objects.create_user(
            username='cascade_user',
            password='testpass123',
        )
        driver = Driver.objects.create(
            user=user,
            license_number='LIC-CASCADE',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        driver_pk = driver.pk
        user.delete()
        self.assertFalse(Driver.objects.filter(pk=driver_pk).exists())
