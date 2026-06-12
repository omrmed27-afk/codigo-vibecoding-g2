from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from auth_app.views import LoginView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/auth/login/', LoginView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/', include('auth_app.urls')),

    # Warehouses
    path('api/', include('warehouses.urls')),

    # Suppliers
    path('api/', include('suppliers.urls')),

    # Customers
    path('api/', include('customers.urls')),

    # Products
    path('api/', include('products.urls')),

    # Drivers
    path('api/', include('drivers.urls')),

    # Transport
    path('api/', include('transport.urls')),

    # Routes
    path('api/', include('routes.urls')),

    # Shipments
    path('api/', include('shipments.urls')),

    # API schema & docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
