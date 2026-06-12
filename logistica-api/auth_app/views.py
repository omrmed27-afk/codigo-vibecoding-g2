from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers as drf_serializers
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from core.permissions import IsSuperAdmin
from core.pagination import StandardPagination
from .serializers import (
    AssignGroupsSerializer,
    AssignPermissionsSerializer,
    GroupSerializer,
    GroupWithPermissionsSerializer,
    PermissionSerializer,
    RegisterSerializer,
    UserCreateSerializer,
    UserListSerializer,
    UserUpdateSerializer,
)

User = get_user_model()


class LoginView(TokenObtainPairView):
    """Extends SimpleJWT login to include user info in the response."""

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.user
        return Response({
            **serializer.validated_data,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_superuser': user.is_superuser,
            },
        })


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        permissions = [] if user.is_superuser else list(user.get_all_permissions())
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_superuser': user.is_superuser,
            'permissions': permissions,
        })


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        request=RegisterSerializer,
        responses={
            201: inline_serializer(
                name='RegisterResponse',
                fields={
                    'access': drf_serializers.CharField(),
                    'refresh': drf_serializers.CharField(),
                    'user': inline_serializer(
                        name='RegisteredUser',
                        fields={
                            'id': drf_serializers.IntegerField(),
                            'username': drf_serializers.CharField(),
                            'email': drf_serializers.EmailField(),
                        },
                    ),
                },
            )
        },
        tags=['auth'],
        summary='Register a new user account',
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.create_user(**serializer.validated_data)
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class UserManagementViewSet(ModelViewSet):
    permission_classes = [IsSuperAdmin]
    pagination_class = StandardPagination
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return User.objects.prefetch_related('groups').order_by('id')

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ('partial_update', 'update'):
            return UserUpdateSerializer
        if self.action == 'assign_groups':
            return AssignGroupsSerializer
        return UserListSerializer

    def create(self, request, *args, **kwargs):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserListSerializer(user).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserListSerializer(user).data)

    @action(detail=True, methods=['post'], url_path='assign-groups')
    def assign_groups(self, request, pk=None):
        user = self.get_object()
        serializer = AssignGroupsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user.groups.set(Group.objects.filter(id__in=serializer.validated_data['group_ids']))
        return Response(UserListSerializer(user).data)


class GroupListView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        groups = Group.objects.all().order_by('name')
        return Response(GroupSerializer(groups, many=True).data)

    def post(self, request):
        name = (request.data.get('name') or '').strip()
        if not name:
            return Response({'name': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)
        if Group.objects.filter(name=name).exists():
            return Response({'name': ['A group with this name already exists.']}, status=status.HTTP_400_BAD_REQUEST)
        group = Group.objects.create(name=name)
        return Response(GroupSerializer(group).data, status=status.HTTP_201_CREATED)


class GroupDetailView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request, pk):
        group = get_object_or_404(Group.objects.prefetch_related('permissions__content_type'), pk=pk)
        return Response(GroupWithPermissionsSerializer(group).data)

    def delete(self, request, pk):
        group = get_object_or_404(Group, pk=pk)
        group.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GroupAssignPermissionsView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        group = get_object_or_404(Group, pk=pk)
        serializer = AssignPermissionsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        group.permissions.set(
            Permission.objects.filter(id__in=serializer.validated_data['permission_ids'])
        )
        updated = Group.objects.prefetch_related('permissions__content_type').get(pk=pk)
        return Response(GroupWithPermissionsSerializer(updated).data)


LOCAL_APPS = ['shipments', 'customers', 'products', 'warehouses', 'suppliers', 'drivers', 'transport', 'routes']


class PermissionListView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        permissions = (
            Permission.objects
            .filter(content_type__app_label__in=LOCAL_APPS)
            .select_related('content_type')
            .order_by('content_type__app_label', 'content_type__model', 'codename')
        )
        return Response(PermissionSerializer(permissions, many=True).data)
