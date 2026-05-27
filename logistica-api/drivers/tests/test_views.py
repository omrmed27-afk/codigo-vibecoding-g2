from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from drivers.models import Driver


class DriverViewSetSetupMixin:
    """Mixin para setup compartido entre test clases de la API."""

    def _create_auth_user(self, username='api_test_user'):
        """Crea un usuario de autenticación (separado del user del driver)."""
        return User.objects.create_user(username=username, password='testpass123')

    def _create_driver(self, username, license_number, phone='3001234567', status='available'):
        """Helper para crear un driver completo con su user."""
        user = User.objects.create_user(
            username=username,
            password='testpass123',
            first_name='Test',
            last_name='Driver',
            email=f'{username}@example.com',
        )
        driver = Driver.objects.create(
            user=user,
            license_number=license_number,
            license_expiry='2028-01-01',
            phone=phone,
            status=status,
        )
        return driver

    def _valid_create_payload(self, overrides=None):
        data = {
            'username': 'new_api_driver',
            'password': 'securepass123',
            'email': 'api_driver@example.com',
            'first_name': 'Api',
            'last_name': 'Driver',
            'license_number': 'LIC-API-001',
            'license_expiry': '2028-06-30',
            'phone': '3201234567',
            'status': 'available',
        }
        if overrides:
            data.update(overrides)
        return data


class DriverListCreateAPITest(DriverViewSetSetupMixin, APITestCase):
    """Tests para GET /api/drivers/ y POST /api/drivers/."""

    def setUp(self):
        self.auth_user = self._create_auth_user()
        self.client.force_authenticate(user=self.auth_user)

    # ---- GET list happy path ----

    def test_list_drivers_returns_200(self):
        response = self.client.get('/api/drivers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_drivers_empty_returns_empty_results(self):
        response = self.client.get('/api/drivers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])

    def test_list_drivers_with_existing_driver(self):
        self._create_driver('list_drv', 'LIC-LIST-001')
        response = self.client.get('/api/drivers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_list_drivers_response_has_pagination_keys(self):
        response = self.client.get('/api/drivers/')
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)

    def test_list_drivers_result_has_expected_fields(self):
        self._create_driver('field_drv', 'LIC-FIELD-001')
        response = self.client.get('/api/drivers/')
        driver_data = response.data['results'][0]
        for field in ['id', 'user', 'license_number', 'license_expiry', 'phone', 'status']:
            self.assertIn(field, driver_data)

    def test_list_drivers_user_field_is_nested_object(self):
        self._create_driver('nested_drv', 'LIC-NESTED-001')
        response = self.client.get('/api/drivers/')
        user_data = response.data['results'][0]['user']
        self.assertIsInstance(user_data, dict)
        self.assertIn('username', user_data)

    # ---- GET list unhappy path ----

    def test_list_drivers_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/drivers/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ---- POST create happy path ----

    def test_create_driver_returns_201(self):
        response = self.client.post('/api/drivers/', self._valid_create_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_driver_response_has_id(self):
        response = self.client.post('/api/drivers/', self._valid_create_payload(), format='json')
        self.assertIn('id', response.data)

    def test_create_driver_response_has_nested_user(self):
        response = self.client.post('/api/drivers/', self._valid_create_payload(), format='json')
        self.assertIsInstance(response.data['user'], dict)
        self.assertEqual(response.data['user']['username'], 'new_api_driver')

    def test_create_driver_persists_in_database(self):
        self.client.post('/api/drivers/', self._valid_create_payload(), format='json')
        self.assertTrue(Driver.objects.filter(license_number='LIC-API-001').exists())

    def test_create_driver_creates_associated_user(self):
        self.client.post('/api/drivers/', self._valid_create_payload(), format='json')
        self.assertTrue(User.objects.filter(username='new_api_driver').exists())

    def test_create_driver_without_optional_fields(self):
        data = {
            'username': 'minimal_api_drv',
            'password': 'securepass123',
            'license_number': 'LIC-MIN-API',
            'license_expiry': '2028-06-30',
            'phone': '3201234567',
        }
        response = self.client.post('/api/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # ---- POST create unhappy path ----

    def test_create_driver_missing_username_returns_400(self):
        data = self._valid_create_payload()
        del data['username']
        response = self.client.post('/api/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_driver_missing_password_returns_400(self):
        data = self._valid_create_payload()
        del data['password']
        response = self.client.post('/api/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_driver_missing_license_number_returns_400(self):
        data = self._valid_create_payload()
        del data['license_number']
        response = self.client.post('/api/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_driver_missing_license_expiry_returns_400(self):
        data = self._valid_create_payload()
        del data['license_expiry']
        response = self.client.post('/api/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_driver_missing_phone_returns_400(self):
        data = self._valid_create_payload()
        del data['phone']
        response = self.client.post('/api/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_driver_invalid_status_returns_400(self):
        data = self._valid_create_payload({'status': 'invalid_status'})
        response = self.client.post('/api/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_driver_duplicate_license_returns_400(self):
        self._create_driver('existing_drv', 'LIC-DUP-API')
        data = self._valid_create_payload({'license_number': 'LIC-DUP-API'})
        response = self.client.post('/api/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_driver_invalid_email_returns_400(self):
        data = self._valid_create_payload({'email': 'not-an-email'})
        response = self.client.post('/api/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_driver_invalid_date_returns_400(self):
        data = self._valid_create_payload({'license_expiry': 'not-a-date'})
        response = self.client.post('/api/drivers/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_driver_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/drivers/', self._valid_create_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_driver_error_response_has_error_key(self):
        data = self._valid_create_payload()
        del data['username']
        response = self.client.post('/api/drivers/', data, format='json')
        self.assertIn('error', response.data)


class DriverRetrieveAPITest(DriverViewSetSetupMixin, APITestCase):
    """Tests para GET /api/drivers/<id>/."""

    def setUp(self):
        self.auth_user = self._create_auth_user()
        self.client.force_authenticate(user=self.auth_user)
        self.driver = self._create_driver('retrieve_drv', 'LIC-RET-001')

    def test_retrieve_driver_returns_200(self):
        response = self.client.get(f'/api/drivers/{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_driver_correct_data(self):
        response = self.client.get(f'/api/drivers/{self.driver.pk}/')
        self.assertEqual(response.data['id'], self.driver.pk)
        self.assertEqual(response.data['license_number'], 'LIC-RET-001')

    def test_retrieve_driver_user_is_nested(self):
        response = self.client.get(f'/api/drivers/{self.driver.pk}/')
        self.assertIsInstance(response.data['user'], dict)

    def test_retrieve_nonexistent_driver_returns_404(self):
        response = self.client.get('/api/drivers/9999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_driver_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(f'/api/drivers/{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DriverUpdateAPITest(DriverViewSetSetupMixin, APITestCase):
    """Tests para PUT /api/drivers/<id>/ y PATCH /api/drivers/<id>/."""

    def setUp(self):
        self.auth_user = self._create_auth_user()
        self.client.force_authenticate(user=self.auth_user)
        self.driver = self._create_driver('update_drv', 'LIC-UPD-API')

    # ---- PUT (full update) ----

    def test_put_driver_returns_200(self):
        data = {
            'license_number': 'LIC-UPD-API',
            'license_expiry': '2029-01-01',
            'phone': '3400000000',
            'status': 'busy',
        }
        response = self.client.put(f'/api/drivers/{self.driver.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_put_driver_updates_phone(self):
        data = {
            'phone': '3400000000',
            'license_number': 'LIC-UPD-API',
            'license_expiry': '2029-01-01',
        }
        response = self.client.put(f'/api/drivers/{self.driver.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['phone'], '3400000000')

    def test_put_driver_updates_status(self):
        data = {'status': 'off_duty'}
        response = self.client.put(f'/api/drivers/{self.driver.pk}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'off_duty')

    def test_put_nonexistent_driver_returns_404(self):
        response = self.client.put('/api/drivers/9999/', {'phone': '3111111111'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_put_driver_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.put(f'/api/drivers/{self.driver.pk}/', {'phone': '3111111111'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ---- PATCH (partial update) ----

    def test_patch_driver_returns_200(self):
        response = self.client.patch(f'/api/drivers/{self.driver.pk}/', {'phone': '3500000000'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_driver_updates_only_specified_field(self):
        response = self.client.patch(f'/api/drivers/{self.driver.pk}/', {'status': 'busy'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'busy')
        # license_number should remain unchanged
        self.assertEqual(response.data['license_number'], 'LIC-UPD-API')

    def test_patch_driver_user_fields(self):
        response = self.client.patch(
            f'/api/drivers/{self.driver.pk}/',
            {'first_name': 'UpdatedName'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['first_name'], 'UpdatedName')

    def test_patch_driver_invalid_status_returns_400(self):
        response = self.client.patch(
            f'/api/drivers/{self.driver.pk}/',
            {'status': 'invalid_choice'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_nonexistent_driver_returns_404(self):
        response = self.client.patch('/api/drivers/9999/', {'phone': '3111111111'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class DriverDeleteAPITest(DriverViewSetSetupMixin, APITestCase):
    """Tests para DELETE /api/drivers/<id>/."""

    def setUp(self):
        self.auth_user = self._create_auth_user()
        self.client.force_authenticate(user=self.auth_user)
        self.driver = self._create_driver('delete_drv', 'LIC-DEL-API')

    def test_delete_driver_returns_204(self):
        response = self.client.delete(f'/api/drivers/{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_driver_removes_from_database(self):
        driver_pk = self.driver.pk
        self.client.delete(f'/api/drivers/{driver_pk}/')
        self.assertFalse(Driver.objects.filter(pk=driver_pk).exists())

    def test_delete_driver_removes_associated_user(self):
        user_pk = self.driver.user.pk
        self.client.delete(f'/api/drivers/{self.driver.pk}/')
        self.assertFalse(User.objects.filter(pk=user_pk).exists())

    def test_delete_nonexistent_driver_returns_404(self):
        response = self.client.delete('/api/drivers/9999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_driver_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.delete(f'/api/drivers/{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DriverFilterAPITest(DriverViewSetSetupMixin, APITestCase):
    """Tests para filtrado por status en /api/drivers/."""

    def setUp(self):
        self.auth_user = self._create_auth_user()
        self.client.force_authenticate(user=self.auth_user)
        self._create_driver('avail_drv', 'LIC-AVAIL-001', status='available')
        self._create_driver('busy_drv', 'LIC-BUSY-001', status='busy')
        self._create_driver('off_drv', 'LIC-OFF-001', status='off_duty')

    def test_filter_by_status_available(self):
        response = self.client.get('/api/drivers/?status=available')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for driver_data in response.data['results']:
            self.assertEqual(driver_data['status'], 'available')

    def test_filter_by_status_busy(self):
        response = self.client.get('/api/drivers/?status=busy')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for driver_data in response.data['results']:
            self.assertEqual(driver_data['status'], 'busy')

    def test_filter_by_status_off_duty(self):
        response = self.client.get('/api/drivers/?status=off_duty')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for driver_data in response.data['results']:
            self.assertEqual(driver_data['status'], 'off_duty')

    def test_list_without_filter_returns_all_drivers(self):
        response = self.client.get('/api/drivers/')
        self.assertEqual(response.data['count'], 3)
