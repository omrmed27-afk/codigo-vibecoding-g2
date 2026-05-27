# Spec: Auth App — Register Endpoint

## Nota previa

No hay modelo nuevo. Usa `django.contrib.auth.get_user_model()`. App nueva: `auth_app` (evita conflicto con `django.contrib.auth`). Solo necesita serializers.py, views.py, urls.py.

## App

- [ ] `python manage.py startapp auth_app`
- [ ] Registrar `'auth_app'` en `INSTALLED_APPS`
- [ ] Eliminar archivos innecesarios: models.py, admin.py, tests.py (o dejarlos vacíos)

## Serializer (`auth_app/serializers.py`)

- [ ] `RegisterSerializer(serializers.Serializer)`:
  - [ ] `username = serializers.CharField(max_length=150)`
  - [ ] `password = serializers.CharField(write_only=True, min_length=8)`
  - [ ] `email = serializers.EmailField(required=False, allow_blank=True, default='')`
  - [ ] `first_name = serializers.CharField(max_length=150, required=False, default='')`
  - [ ] `last_name = serializers.CharField(max_length=150, required=False, default='')`
  - [ ] `validate_username(value)` — si username ya existe en DB: raise `ValidationError('A user with this username already exists.')`
  - [ ] `validate_email(value)` — si valor no vacío y ya existe en otro user: raise `ValidationError('A user with this email already exists.')`

## View (`auth_app/views.py`)

- [ ] `RegisterView(APIView)`:
  - [ ] `permission_classes = [AllowAny]`
  - [ ] `authentication_classes = []`
  - [ ] `post(self, request)`:
    1. `serializer = RegisterSerializer(data=request.data)`
    2. `serializer.is_valid(raise_exception=True)`
    3. `user = User.objects.create_user(**serializer.validated_data)`
    4. `refresh = RefreshToken.for_user(user)`
    5. Retornar 201:
       ```json
       {
         "access": "<str(refresh.access_token)>",
         "refresh": "<str(refresh)>",
         "user": { "id": user.id, "username": user.username, "email": user.email }
       }
       ```

## URLs

- [ ] `auth_app/urls.py`:
  ```python
  from django.urls import path
  from .views import RegisterView
  urlpatterns = [path('register/', RegisterView.as_view(), name='register')]
  ```
- [ ] `config/urls.py`: agregar `path('api/auth/', include('auth_app.urls'))` — junto a los paths de simplejwt ya existentes (login y refresh usan `api/auth/login/` y `api/auth/refresh/` que ya están). Verificar que no haya conflicto de prefijos.

## Endpoints resultantes

| Método | URL | Acción | Auth requerida |
|--------|-----|--------|----------------|
| POST | `/api/auth/login/` | Obtener tokens JWT | No |
| POST | `/api/auth/refresh/` | Renovar access token | No |
| POST | `/api/auth/register/` | Crear cuenta + retornar tokens | No |
