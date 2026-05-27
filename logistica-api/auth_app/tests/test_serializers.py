from django.contrib.auth import get_user_model
from django.test import TestCase

from auth_app.serializers import RegisterSerializer

User = get_user_model()


class RegisterSerializerValidationTests(TestCase):
    """Tests for RegisterSerializer validation logic."""

    # ------------------------------------------------------------------ happy path

    def test_valid_data_with_all_fields(self):
        """All fields provided and valid — serializer must be valid."""
        data = {
            'username': 'john_doe',
            'password': 'securepass',
            'email': 'john@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
        }
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_data_with_required_fields_only(self):
        """Only username and password provided — email/first_name/last_name are optional."""
        data = {
            'username': 'minimaluser',
            'password': 'password123',
        }
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_data_applies_defaults_for_optional_fields(self):
        """Omitted optional fields default to empty string."""
        data = {
            'username': 'defaultsuser',
            'password': 'password123',
        }
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['email'], '')
        self.assertEqual(serializer.validated_data['first_name'], '')
        self.assertEqual(serializer.validated_data['last_name'], '')

    def test_password_exactly_8_characters_is_valid(self):
        """Password with exactly 8 characters meets the minimum length."""
        data = {
            'username': 'user8chars',
            'password': '12345678',
        }
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_email_is_accepted(self):
        """A properly formatted email must pass validation."""
        data = {
            'username': 'emailuser',
            'password': 'password123',
            'email': 'valid@domain.org',
        }
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_empty_string_email_is_allowed(self):
        """An empty string for email is allowed (field is not required)."""
        data = {
            'username': 'emptyemailuser',
            'password': 'password123',
            'email': '',
        }
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    # ------------------------------------------------------------------ unhappy path: username

    def test_missing_username_is_invalid(self):
        """Username is required — omitting it must produce a validation error."""
        data = {'password': 'password123'}
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)

    def test_duplicate_username_is_rejected(self):
        """Username already taken — serializer must raise a validation error."""
        User.objects.create_user(username='existinguser', password='testpass1')
        data = {
            'username': 'existinguser',
            'password': 'newpassword',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)

    def test_duplicate_username_error_message(self):
        """Error message for duplicate username must be descriptive."""
        User.objects.create_user(username='takenuser', password='testpass1')
        data = {'username': 'takenuser', 'password': 'newpassword'}
        serializer = RegisterSerializer(data=data)
        serializer.is_valid()
        self.assertIn('already exists', str(serializer.errors['username']))

    def test_username_exceeding_max_length_is_invalid(self):
        """Username longer than 150 characters must fail validation."""
        data = {
            'username': 'a' * 151,
            'password': 'password123',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)

    # ------------------------------------------------------------------ unhappy path: password

    def test_missing_password_is_invalid(self):
        """Password is required — omitting it must produce a validation error."""
        data = {'username': 'nopassworduser'}
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_password_shorter_than_8_chars_is_invalid(self):
        """Password with fewer than 8 characters must fail the min_length constraint."""
        data = {
            'username': 'shortpassuser',
            'password': 'short',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_password_7_chars_is_invalid(self):
        """Password of exactly 7 characters (one below minimum) must be rejected."""
        data = {
            'username': 'seven_chars',
            'password': '1234567',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    # ------------------------------------------------------------------ unhappy path: email

    def test_invalid_email_format_is_rejected(self):
        """A string that is not a valid email address must fail validation."""
        data = {
            'username': 'invalidemail',
            'password': 'password123',
            'email': 'not-an-email',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_duplicate_email_is_rejected(self):
        """Email already in use by another user must be rejected."""
        User.objects.create_user(
            username='original', password='testpass1', email='taken@example.com'
        )
        data = {
            'username': 'newuser',
            'password': 'password123',
            'email': 'taken@example.com',
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_duplicate_email_error_message(self):
        """Error message for duplicate email must be descriptive."""
        User.objects.create_user(
            username='origuser', password='testpass1', email='duplicate@example.com'
        )
        data = {
            'username': 'anotheruser',
            'password': 'password123',
            'email': 'duplicate@example.com',
        }
        serializer = RegisterSerializer(data=data)
        serializer.is_valid()
        self.assertIn('already exists', str(serializer.errors['email']))

    # ------------------------------------------------------------------ write-only field

    def test_password_is_write_only(self):
        """Password field is write_only — it must not appear in serialized output."""
        field = RegisterSerializer().fields['password']
        self.assertTrue(field.write_only)

    # ------------------------------------------------------------------ edge cases

    def test_both_username_and_email_missing_produces_errors_on_both(self):
        """Omitting both required/validated fields produces errors on both."""
        data = {'password': 'password123'}
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)

    def test_unique_email_check_skips_empty_string(self):
        """Empty email must NOT trigger unique-email validation (skip if falsy)."""
        User.objects.create_user(username='user1', password='testpass1', email='')
        data = {
            'username': 'user2',
            'password': 'password123',
            'email': '',
        }
        serializer = RegisterSerializer(data=data)
        # Empty email is always allowed even if another user has blank email
        self.assertTrue(serializer.is_valid(), serializer.errors)
