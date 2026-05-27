from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

REGISTER_URL = '/api/auth/register/'
LOGIN_URL = '/api/auth/login/'
REFRESH_URL = '/api/auth/refresh/'


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _valid_register_payload(**overrides):
    payload = {
        'username': 'newuser',
        'password': 'securepass',
        'email': 'newuser@example.com',
        'first_name': 'New',
        'last_name': 'User',
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# POST /api/auth/register/
# ---------------------------------------------------------------------------

class RegisterViewHappyPathTests(APITestCase):
    """Happy path tests for the register endpoint."""

    def test_register_with_all_fields_returns_201(self):
        """Valid payload with all fields must return HTTP 201."""
        response = self.client.post(REGISTER_URL, _valid_register_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_register_creates_user_in_database(self):
        """After successful registration the user must exist in the database."""
        self.client.post(REGISTER_URL, _valid_register_payload(), format='json')
        self.assertTrue(User.objects.filter(username='newuser').exists())

    def test_register_response_contains_access_token(self):
        """Response must include an 'access' JWT token string."""
        response = self.client.post(REGISTER_URL, _valid_register_payload(), format='json')
        self.assertIn('access', response.data)
        self.assertIsInstance(response.data['access'], str)
        self.assertTrue(len(response.data['access']) > 0)

    def test_register_response_contains_refresh_token(self):
        """Response must include a 'refresh' JWT token string."""
        response = self.client.post(REGISTER_URL, _valid_register_payload(), format='json')
        self.assertIn('refresh', response.data)
        self.assertIsInstance(response.data['refresh'], str)
        self.assertTrue(len(response.data['refresh']) > 0)

    def test_register_response_contains_user_object(self):
        """Response must include a 'user' object with id, username and email."""
        response = self.client.post(REGISTER_URL, _valid_register_payload(), format='json')
        self.assertIn('user', response.data)
        user_data = response.data['user']
        self.assertIn('id', user_data)
        self.assertIn('username', user_data)
        self.assertIn('email', user_data)

    def test_register_response_user_matches_submitted_data(self):
        """Returned user object must match the username and email that were submitted."""
        payload = _valid_register_payload()
        response = self.client.post(REGISTER_URL, payload, format='json')
        self.assertEqual(response.data['user']['username'], payload['username'])
        self.assertEqual(response.data['user']['email'], payload['email'])

    def test_register_with_required_fields_only_returns_201(self):
        """Registration with only username and password must succeed."""
        payload = {'username': 'minimaluser', 'password': 'password123'}
        response = self.client.post(REGISTER_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_register_does_not_require_authentication(self):
        """Register endpoint is public — no auth header should be needed."""
        # Client is not authenticated; request must still succeed
        payload = _valid_register_payload(username='anonuser', email='anon@example.com')
        response = self.client.post(REGISTER_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_register_response_does_not_expose_password(self):
        """The response must not contain the user's password in any field."""
        response = self.client.post(REGISTER_URL, _valid_register_payload(), format='json')
        response_text = str(response.data)
        self.assertNotIn('securepass', response_text)

    def test_register_with_optional_fields_omitted_email_defaults_empty(self):
        """When email is not provided the user is created with an empty email."""
        payload = {'username': 'noemail', 'password': 'password123'}
        self.client.post(REGISTER_URL, payload, format='json')
        user = User.objects.get(username='noemail')
        self.assertEqual(user.email, '')


class RegisterViewUnhappyPathTests(APITestCase):
    """Unhappy path tests for the register endpoint."""

    def test_missing_username_returns_400(self):
        """Request without username must return HTTP 400."""
        payload = {'password': 'password123'}
        response = self.client.post(REGISTER_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_password_returns_400(self):
        """Request without password must return HTTP 400."""
        payload = {'username': 'nopassword'}
        response = self.client.post(REGISTER_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_username_returns_400(self):
        """Registering with an already-taken username must return HTTP 400."""
        User.objects.create_user(username='taken', password='testpass1')
        payload = _valid_register_payload(username='taken')
        response = self.client.post(REGISTER_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_email_returns_400(self):
        """Registering with an already-used email must return HTTP 400."""
        User.objects.create_user(
            username='original', password='testpass1', email='taken@example.com'
        )
        payload = _valid_register_payload(username='newguy', email='taken@example.com')
        response = self.client.post(REGISTER_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_short_password_returns_400(self):
        """Password with fewer than 8 characters must return HTTP 400."""
        payload = _valid_register_payload(password='short')
        response = self.client.post(REGISTER_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_email_format_returns_400(self):
        """A malformed email address must return HTTP 400."""
        payload = _valid_register_payload(email='not-an-email')
        response = self.client.post(REGISTER_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_error_response_uses_custom_error_format(self):
        """400 response must follow the project's standard error envelope."""
        payload = {'password': 'password123'}  # missing username
        response = self.client.post(REGISTER_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('code', response.data['error'])
        self.assertIn('message', response.data['error'])
        self.assertIn('details', response.data['error'])

    def test_error_code_for_400_is_validation_error(self):
        """The error 'code' for a 400 response must be 'validation_error'."""
        payload = {'password': 'password123'}
        response = self.client.post(REGISTER_URL, payload, format='json')
        self.assertEqual(response.data['error']['code'], 'validation_error')

    def test_empty_body_returns_400(self):
        """Sending an empty body must return HTTP 400."""
        response = self.client.post(REGISTER_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class RegisterViewEdgeCaseTests(APITestCase):
    """Edge case tests for the register endpoint."""

    def test_password_exactly_8_chars_succeeds(self):
        """Password of exactly 8 characters meets the minimum — must return 201."""
        payload = _valid_register_payload(password='12345678')
        response = self.client.post(REGISTER_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_password_7_chars_fails(self):
        """Password of exactly 7 characters is one below minimum — must return 400."""
        payload = _valid_register_payload(password='1234567')
        response = self.client.post(REGISTER_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_username_at_max_length_succeeds(self):
        """Username of exactly 150 characters is at the boundary — must succeed."""
        payload = _valid_register_payload(username='a' * 150, email='maxlen@example.com')
        response = self.client.post(REGISTER_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_username_over_max_length_fails(self):
        """Username of 151 characters exceeds the max — must return 400."""
        payload = _valid_register_payload(username='a' * 151, email='toolong@example.com')
        response = self.client.post(REGISTER_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_two_users_can_register_with_empty_email(self):
        """Multiple users with no email (empty string) must all be allowed."""
        payload1 = {'username': 'user_a', 'password': 'password123', 'email': ''}
        payload2 = {'username': 'user_b', 'password': 'password123', 'email': ''}
        r1 = self.client.post(REGISTER_URL, payload1, format='json')
        r2 = self.client.post(REGISTER_URL, payload2, format='json')
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED)

    def test_user_id_in_response_is_integer(self):
        """The 'id' field in the returned user object must be an integer."""
        response = self.client.post(REGISTER_URL, _valid_register_payload(), format='json')
        self.assertIsInstance(response.data['user']['id'], int)


# ---------------------------------------------------------------------------
# POST /api/auth/login/
# ---------------------------------------------------------------------------

class LoginViewHappyPathTests(APITestCase):
    """Happy path tests for the simplejwt login endpoint."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='loginuser',
            password='correctpassword',
            email='login@example.com',
        )

    def test_valid_credentials_return_200(self):
        """Correct username and password must return HTTP 200."""
        payload = {'username': 'loginuser', 'password': 'correctpassword'}
        response = self.client.post(LOGIN_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_response_contains_access_token(self):
        """Successful login response must include an 'access' token."""
        payload = {'username': 'loginuser', 'password': 'correctpassword'}
        response = self.client.post(LOGIN_URL, payload, format='json')
        self.assertIn('access', response.data)
        self.assertIsInstance(response.data['access'], str)
        self.assertTrue(len(response.data['access']) > 0)

    def test_response_contains_refresh_token(self):
        """Successful login response must include a 'refresh' token."""
        payload = {'username': 'loginuser', 'password': 'correctpassword'}
        response = self.client.post(LOGIN_URL, payload, format='json')
        self.assertIn('refresh', response.data)
        self.assertIsInstance(response.data['refresh'], str)
        self.assertTrue(len(response.data['refresh']) > 0)

    def test_login_does_not_require_authentication(self):
        """Login endpoint is public — unauthenticated client must receive 200."""
        payload = {'username': 'loginuser', 'password': 'correctpassword'}
        response = self.client.post(LOGIN_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class LoginViewUnhappyPathTests(APITestCase):
    """Unhappy path tests for the simplejwt login endpoint."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='realuser',
            password='realpassword',
        )

    def test_wrong_password_returns_401(self):
        """Incorrect password must return HTTP 401."""
        payload = {'username': 'realuser', 'password': 'wrongpassword'}
        response = self.client.post(LOGIN_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_nonexistent_user_returns_401(self):
        """Username that does not exist must return HTTP 401."""
        payload = {'username': 'ghost', 'password': 'password123'}
        response = self.client.post(LOGIN_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_username_returns_400(self):
        """Request without username must return HTTP 400."""
        payload = {'password': 'realpassword'}
        response = self.client.post(LOGIN_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_password_returns_400(self):
        """Request without password must return HTTP 400."""
        payload = {'username': 'realuser'}
        response = self.client.post(LOGIN_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_body_returns_400(self):
        """Empty body must return HTTP 400."""
        response = self.client.post(LOGIN_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_401_response_uses_custom_error_format(self):
        """Unauthorized response must follow the project's error envelope."""
        payload = {'username': 'realuser', 'password': 'wrongpassword'}
        response = self.client.post(LOGIN_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error']['code'], 'authentication_required')


# ---------------------------------------------------------------------------
# POST /api/auth/refresh/
# ---------------------------------------------------------------------------

class RefreshViewHappyPathTests(APITestCase):
    """Happy path tests for the simplejwt refresh endpoint."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='refreshuser',
            password='refreshpassword',
        )
        # Obtain a valid refresh token via login
        login_resp = self.client.post(
            LOGIN_URL,
            {'username': 'refreshuser', 'password': 'refreshpassword'},
            format='json',
        )
        self.refresh_token = login_resp.data['refresh']

    def test_valid_refresh_token_returns_200(self):
        """A valid refresh token must return HTTP 200."""
        response = self.client.post(
            REFRESH_URL, {'refresh': self.refresh_token}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_valid_refresh_token_returns_new_access_token(self):
        """The response must contain a new 'access' token."""
        response = self.client.post(
            REFRESH_URL, {'refresh': self.refresh_token}, format='json'
        )
        self.assertIn('access', response.data)
        self.assertIsInstance(response.data['access'], str)
        self.assertTrue(len(response.data['access']) > 0)

    def test_refresh_does_not_require_authentication(self):
        """Refresh endpoint is public — unauthenticated client must receive 200."""
        response = self.client.post(
            REFRESH_URL, {'refresh': self.refresh_token}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class RefreshViewUnhappyPathTests(APITestCase):
    """Unhappy path tests for the simplejwt refresh endpoint."""

    def test_invalid_token_returns_401(self):
        """An invalid or tampered refresh token must return HTTP 401."""
        response = self.client.post(
            REFRESH_URL, {'refresh': 'this.is.not.a.valid.token'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_refresh_field_returns_400(self):
        """Request without 'refresh' field must return HTTP 400."""
        response = self.client.post(REFRESH_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_401_response_uses_custom_error_format(self):
        """Unauthorized response must follow the project's error envelope."""
        response = self.client.post(
            REFRESH_URL, {'refresh': 'bad.token.value'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error']['code'], 'authentication_required')
