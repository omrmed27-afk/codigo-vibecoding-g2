from django.test import TestCase
from django.contrib.auth.models import User

from drivers.models import Driver
from drivers.serializers import DriverReadSerializer, DriverWriteSerializer, UserSummarySerializer


class UserSummarySerializerTest(TestCase):
    """Tests del serializer de resumen de usuario."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='sertest_user',
            password='testpass123',
            first_name='Ana',
            last_name='Lopez',
            email='ana@example.com',
        )

    def test_user_summary_includes_expected_fields(self):
        serializer = UserSummarySerializer(self.user)
        data = serializer.data
        self.assertIn('id', data)
        self.assertIn('username', data)
        self.assertIn('email', data)
        self.assertIn('first_name', data)
        self.assertIn('last_name', data)

    def test_user_summary_values_correct(self):
        serializer = UserSummarySerializer(self.user)
        data = serializer.data
        self.assertEqual(data['username'], 'sertest_user')
        self.assertEqual(data['email'], 'ana@example.com')
        self.assertEqual(data['first_name'], 'Ana')
        self.assertEqual(data['last_name'], 'Lopez')


class DriverReadSerializerTest(TestCase):
    """Tests del serializer de lectura de Driver."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='readser_user',
            password='testpass123',
            first_name='Carlos',
            last_name='Gomez',
            email='carlos@example.com',
        )
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-READ-001',
            license_expiry='2027-06-30',
            phone='3107654321',
            status='available',
        )

    def test_read_serializer_includes_all_expected_fields(self):
        serializer = DriverReadSerializer(self.driver)
        data = serializer.data
        expected_fields = ['id', 'user', 'license_number', 'license_expiry', 'phone', 'status', 'created_at', 'updated_at']
        for field in expected_fields:
            self.assertIn(field, data)

    def test_read_serializer_user_is_nested_object(self):
        serializer = DriverReadSerializer(self.driver)
        data = serializer.data
        self.assertIsInstance(data['user'], dict)
        self.assertEqual(data['user']['username'], 'readser_user')

    def test_read_serializer_correct_values(self):
        serializer = DriverReadSerializer(self.driver)
        data = serializer.data
        self.assertEqual(data['license_number'], 'LIC-READ-001')
        self.assertEqual(data['phone'], '3107654321')
        self.assertEqual(data['status'], 'available')

    def test_read_serializer_license_expiry_format(self):
        serializer = DriverReadSerializer(self.driver)
        data = serializer.data
        self.assertEqual(data['license_expiry'], '2027-06-30')


class DriverWriteSerializerCreateTest(TestCase):
    """Tests del serializer de escritura para creación."""

    def _valid_data(self, overrides=None):
        data = {
            'username': 'new_driver',
            'password': 'securepass123',
            'email': 'new@example.com',
            'first_name': 'Luis',
            'last_name': 'Ramirez',
            'license_number': 'LIC-WRITE-001',
            'license_expiry': '2028-01-15',
            'phone': '3201234567',
            'status': 'available',
        }
        if overrides:
            data.update(overrides)
        return data

    def test_valid_create_data_is_valid(self):
        serializer = DriverWriteSerializer(data=self._valid_data())
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_missing_username_is_invalid(self):
        data = self._valid_data()
        del data['username']
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)

    def test_missing_password_is_invalid(self):
        data = self._valid_data()
        del data['password']
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_missing_license_number_is_invalid(self):
        data = self._valid_data()
        del data['license_number']
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('license_number', serializer.errors)

    def test_missing_license_expiry_is_invalid(self):
        data = self._valid_data()
        del data['license_expiry']
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('license_expiry', serializer.errors)

    def test_missing_phone_is_invalid(self):
        data = self._valid_data()
        del data['phone']
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('phone', serializer.errors)

    def test_invalid_status_choice_is_invalid(self):
        data = self._valid_data({'status': 'on_vacation'})
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('status', serializer.errors)

    def test_status_defaults_to_available(self):
        data = self._valid_data()
        del data['status']
        serializer = DriverWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data.get('status'), 'available')

    def test_optional_fields_email_first_last_name(self):
        data = {
            'username': 'minimal_driver',
            'password': 'securepass123',
            'license_number': 'LIC-MIN-001',
            'license_expiry': '2028-01-15',
            'phone': '3201234567',
        }
        serializer = DriverWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_password_field_is_write_only(self):
        serializer = DriverWriteSerializer(data=self._valid_data())
        serializer.is_valid()
        # DriverWriteSerializer is a plain Serializer (not ModelSerializer),
        # so validated_data contains all fields including password.
        # What matters is that the field has write_only=True.
        field = serializer.fields['password']
        self.assertTrue(field.write_only)

    def test_duplicate_license_number_is_invalid(self):
        user_existing = User.objects.create_user(username='exist_drv', password='pass123')
        Driver.objects.create(
            user=user_existing,
            license_number='LIC-DUPE-001',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        data = self._valid_data({'license_number': 'LIC-DUPE-001'})
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('license_number', serializer.errors)

    def test_invalid_email_format_is_invalid(self):
        data = self._valid_data({'email': 'not-an-email'})
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_invalid_date_format_for_license_expiry(self):
        data = self._valid_data({'license_expiry': 'not-a-date'})
        serializer = DriverWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('license_expiry', serializer.errors)


class DriverWriteSerializerUpdateTest(TestCase):
    """Tests del serializer de escritura para actualización (partial)."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='upd_driver',
            password='testpass123',
        )
        self.driver = Driver.objects.create(
            user=self.user,
            license_number='LIC-UPD-001',
            license_expiry='2027-12-31',
            phone='3001234567',
        )

    def test_update_with_partial_data_is_valid(self):
        serializer = DriverWriteSerializer(
            instance=self.driver,
            data={'phone': '3999999999'},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_update_does_not_require_username_or_password(self):
        serializer = DriverWriteSerializer(
            instance=self.driver,
            data={'status': 'busy'},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_update_with_same_license_number_on_same_instance_is_valid(self):
        serializer = DriverWriteSerializer(
            instance=self.driver,
            data={'license_number': 'LIC-UPD-001', 'phone': '3001234567'},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_update_with_different_existing_license_number_is_invalid(self):
        other_user = User.objects.create_user(username='other_drv', password='pass123')
        Driver.objects.create(
            user=other_user,
            license_number='LIC-OTHER-001',
            license_expiry='2027-12-31',
            phone='3001234567',
        )
        serializer = DriverWriteSerializer(
            instance=self.driver,
            data={'license_number': 'LIC-OTHER-001'},
            partial=True,
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('license_number', serializer.errors)
