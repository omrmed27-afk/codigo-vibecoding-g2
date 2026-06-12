from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=False, allow_blank=True, default='')
    first_name = serializers.CharField(max_length=150, required=False, default='')
    last_name = serializers.CharField(max_length=150, required=False, default='')

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']


class UserListSerializer(serializers.ModelSerializer):
    groups = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'is_superuser', 'groups']

    def get_groups(self, obj):
        return list(obj.groups.values_list('name', flat=True))


class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=False, allow_blank=True, default='')
    first_name = serializers.CharField(max_length=150, required=False, default='')
    last_name = serializers.CharField(max_length=150, required=False, default='')
    group_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_group_ids(self, value):
        if value:
            existing = set(Group.objects.filter(id__in=value).values_list('id', flat=True))
            missing = set(value) - existing
            if missing:
                raise serializers.ValidationError(f'Groups not found: {sorted(missing)}')
        return value

    def create(self, validated_data):
        group_ids = validated_data.pop('group_ids', [])
        user = User.objects.create_user(**validated_data)
        if group_ids:
            user.groups.set(Group.objects.filter(id__in=group_ids))
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'is_active']

    def validate_email(self, value):
        qs = User.objects.filter(email=value).exclude(pk=self.instance.pk)
        if value and qs.exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value


class AssignGroupsSerializer(serializers.Serializer):
    group_ids = serializers.ListField(child=serializers.IntegerField())

    def validate_group_ids(self, value):
        existing = set(Group.objects.filter(id__in=value).values_list('id', flat=True))
        missing = set(value) - existing
        if missing:
            raise serializers.ValidationError(f'Groups not found: {sorted(missing)}')
        return value


class PermissionSerializer(serializers.ModelSerializer):
    app_label = serializers.CharField(source='content_type.app_label')
    model = serializers.CharField(source='content_type.model')

    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'app_label', 'model']


class GroupWithPermissionsSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions']


class AssignPermissionsSerializer(serializers.Serializer):
    permission_ids = serializers.ListField(child=serializers.IntegerField())

    def validate_permission_ids(self, value):
        existing = set(Permission.objects.filter(id__in=value).values_list('id', flat=True))
        missing = set(value) - existing
        if missing:
            raise serializers.ValidationError(f'Permissions not found: {sorted(missing)}')
        return value
