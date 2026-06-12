from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    GroupAssignPermissionsView,
    GroupDetailView,
    GroupListView,
    MeView,
    PermissionListView,
    RegisterView,
    UserManagementViewSet,
)

router = DefaultRouter()
router.register('users', UserManagementViewSet, basename='user-management')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', MeView.as_view(), name='me'),
    path('groups/', GroupListView.as_view(), name='group-list'),
    path('groups/<int:pk>/', GroupDetailView.as_view(), name='group-detail'),
    path('groups/<int:pk>/assign-permissions/', GroupAssignPermissionsView.as_view(), name='group-assign-permissions'),
    path('permissions/', PermissionListView.as_view(), name='permission-list'),
    path('', include(router.urls)),
]
