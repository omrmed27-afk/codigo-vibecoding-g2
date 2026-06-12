from rest_framework.permissions import BasePermission, DjangoModelPermissions


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsAdminGroup(BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='admin').exists()


class IsDispatcherOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name__in=['admin', 'dispatcher']).exists()


class StrictDjangoModelPermissions(DjangoModelPermissions):
    """
    Enforces Django model permissions for every HTTP method, including GET (view_*).
    POST on a detail route (custom actions like assign-transport, mark-delivered, etc.)
    requires change_* instead of add_*, since those actions modify existing objects.
    Superusers bypass all checks via Django's built-in has_perm behavior.
    """

    perms_map = {
        'GET': ['%(app_label)s.view_%(model_name)s'],
        'OPTIONS': [],
        'HEAD': [],
        'POST': ['%(app_label)s.add_%(model_name)s'],
        'PUT': ['%(app_label)s.change_%(model_name)s'],
        'PATCH': ['%(app_label)s.change_%(model_name)s'],
        'DELETE': ['%(app_label)s.delete_%(model_name)s'],
    }

    def has_permission(self, request, view):
        # POST on a detail URL (pk present) is a custom action = modify = needs change_*
        if (
            request.method == 'POST'
            and hasattr(view, 'kwargs')
            and view.kwargs.get('pk')
        ):
            if not request.user or not request.user.is_authenticated:
                return False
            if request.user.is_superuser:
                return True
            queryset = self._queryset(view)
            model_cls = queryset.model
            perm = '%(app_label)s.change_%(model_name)s' % {
                'app_label': model_cls._meta.app_label,
                'model_name': model_cls._meta.model_name,
            }
            return request.user.has_perm(perm)
        return super().has_permission(request, view)
