from django.test import TestCase
from django.contrib.auth.models import User
from django.db import IntegrityError

from drivers.models import Driver
from drivers.services import DriverService


class DriverServiceCreateTest(TestCase):
    """Tests del servicio de creación de Driver con User."""

    def _valid_data(self, overrides=None):
        data = {
            'username': 'svc_driver',
            'password': 'securepass123',
            'email': 'svc@example.com',
            'first_name': 'Pedro',
            'last_name': 'Mora',
            'license_number': 'LIC-SVC-001',
            'license_expiry': '2028-06-30',
            'phone': '3101234567',
            'status': 'available',
        }
        if overrides:
            data.update(overrides)
        return data

    def test_create_driver_returns_driver_instance(self):
        driver = DriverService.create_driver_with_user(self._valid_data())
        self.assertIsInstance(driver, Driver)

    def test_create_driver_persists_to_database(self):
        driver = DriverService.create_driver_with_user(self._valid_data())
        self.assertTrue(Driver.objects.filter(pk=driver.pk).exists())

    def test_create_driver_creates_associated_user(self):
        driver = DriverService.create_driver_with_user(self._valid_data())
        self.assertTrue(User.objects.filter(username='svc_driver').exists())

    def test_create_driver_user_fields_set_correctly(self):
        driver = DriverService.create_driver_with_user(self._valid_data())
        user = driver.user
        self.assertEqual(user.username, 'svc_driver')
        self.assertEqual(user.email, 'svc@example.com')
        self.assertEqual(user.first_name, 'Pedro')
        self.assertEqual(user.last_name, 'Mora')

    def test_create_driver_fields_set_correctly(self):
        driver = DriverService.create_driver_with_user(self._valid_data())
        self.assertEqual(driver.license_number, 'LIC-SVC-001')
        self.assertEqual(str(driver.license_expiry), '2028-06-30')
        self.assertEqual(driver.phone, '3101234567')
        self.assertEqual(driver.status, 'available')

    def test_create_driver_password_is_hashed(self):
        driver = DriverService.create_driver_with_user(self._valid_data())
        # Password should not be stored as plain text
        self.assertNotEqual(driver.user.password, 'securepass123')
        self.assertTrue(driver.user.check_password('securepass123'))

    def test_create_driver_returns_instance_with_user_related(self):
        driver = DriverService.create_driver_with_user(self._valid_data())
        # select_related should have preloaded user
        self.assertIsNotNone(driver.user)
        self.assertEqual(driver.user.username, 'svc_driver')

    def test_create_driver_with_minimal_fields(self):
        data = {
            'username': 'minimal_svc',
            'password': 'securepass123',
            'license_number': 'LIC-MIN-SVC',
            'license_expiry': '2028-06-30',
            'phone': '3001111111',
        }
        driver = DriverService.create_driver_with_user(data)
        self.assertIsNotNone(driver.pk)
        self.assertEqual(driver.status, 'available')  # default

    def test_create_driver_duplicate_license_raises_integrity_error(self):
        DriverService.create_driver_with_user(self._valid_data())
        data2 = self._valid_data({
            'username': 'svc_driver2',
            'email': 'svc2@example.com',
            # same license_number
        })
        with self.assertRaises(IntegrityError):
            DriverService.create_driver_with_user(data2)

    def test_create_driver_atomic_transaction_rolls_back_on_failure(self):
        """Si falla la creación del Driver por license_number duplicado, se lanza IntegrityError."""
        # Create the first driver with a specific license number
        DriverService.create_driver_with_user(self._valid_data({'license_number': 'LIC-ATOMIC-001'}))
        drivers_before = Driver.objects.count()
        # Try to create another driver with the same license_number → IntegrityError
        data2 = self._valid_data({
            'username': 'svc_atomic2',
            'email': 'atomic2@example.com',
            'license_number': 'LIC-ATOMIC-001',  # same license → DB constraint violated
        })
        with self.assertRaises(IntegrityError):
            DriverService.create_driver_with_user(data2)
        # Driver count should remain the same (transaction rolled back)
        self.assertEqual(Driver.objects.count(), drivers_before)


class DriverServiceUpdateTest(TestCase):
    """Tests del servicio de actualización de Driver."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='upd_svc_user',
            password='testpass123',
            first_name='Maria',
            last_name='Santos',
            email='maria@example.com',
        )
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-UPD-SVC',
            license_expiry='2027-12-31',
            phone='3001234567',
            status='available',
        )

    def test_update_driver_phone(self):
        updated = DriverService.update_driver_with_user(self.driver, {'phone': '3999999999'})
        self.assertEqual(updated.phone, '3999999999')

    def test_update_driver_status(self):
        updated = DriverService.update_driver_with_user(self.driver, {'status': 'busy'})
        self.assertEqual(updated.status, 'busy')

    def test_update_driver_license_number(self):
        updated = DriverService.update_driver_with_user(self.driver, {'license_number': 'LIC-NEW-001'})
        self.assertEqual(updated.license_number, 'LIC-NEW-001')

    def test_update_user_first_name(self):
        updated = DriverService.update_driver_with_user(self.driver, {'first_name': 'Mariana'})
        self.assertEqual(updated.user.first_name, 'Mariana')

    def test_update_user_email(self):
        updated = DriverService.update_driver_with_user(self.driver, {'email': 'updated@example.com'})
        self.assertEqual(updated.user.email, 'updated@example.com')

    def test_update_user_password_is_hashed(self):
        DriverService.update_driver_with_user(self.driver, {'password': 'newpassword456'})
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpassword456'))

    def test_update_returns_driver_with_user_related(self):
        updated = DriverService.update_driver_with_user(self.driver, {'phone': '3001111111'})
        self.assertIsNotNone(updated.user)

    def test_update_persists_driver_changes(self):
        DriverService.update_driver_with_user(self.driver, {'phone': '3202020202', 'status': 'off_duty'})
        self.driver.refresh_from_db()
        self.assertEqual(self.driver.phone, '3202020202')
        self.assertEqual(self.driver.status, 'off_duty')

    def test_update_with_empty_user_data_does_not_modify_user(self):
        original_username = self.user.username
        DriverService.update_driver_with_user(self.driver, {'phone': '3111111111'})
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, original_username)

    def test_update_both_user_and_driver_fields_atomically(self):
        updated = DriverService.update_driver_with_user(
            self.driver,
            {'first_name': 'Nueva', 'phone': '3500000000'},
        )
        self.assertEqual(updated.user.first_name, 'Nueva')
        self.assertEqual(updated.phone, '3500000000')


class DriverServiceDeleteTest(TestCase):
    """Tests del servicio de eliminación de Driver."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='del_svc_user',
            password='testpass123',
        )
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-DEL-SVC',
            license_expiry='2027-12-31',
            phone='3001234567',
        )

    def test_delete_driver_removes_user(self):
        user_pk = self.user.pk
        DriverService.delete_driver(self.driver)
        self.assertFalse(User.objects.filter(pk=user_pk).exists())

    def test_delete_driver_cascades_to_driver(self):
        driver_pk = self.driver.pk
        DriverService.delete_driver(self.driver)
        self.assertFalse(Driver.objects.filter(pk=driver_pk).exists())
