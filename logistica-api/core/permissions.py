from rest_framework.permissions import BasePermission


class IsAdminGroup(BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='admin').exists()


class IsDispatcherOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name__in=['admin', 'dispatcher']).exists()
