from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from .models import Driver


class UserSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)


class DriverReadSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)
    id = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Driver
        fields = [
            'id',
            'user',
            'license_number',
            'license_expiry',
            'phone',
            'status',
            'created_at',
            'updated_at',
        ]


class DriverWriteSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=False)
    password = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    license_number = serializers.CharField(max_length=50, required=False)
    license_expiry = serializers.DateField(required=False)
    phone = serializers.CharField(max_length=30, required=False)
    status = serializers.ChoiceField(
        choices=['available', 'busy', 'off_duty'],
        required=False,
        default='available',
    )

    def validate_license_number(self, value):
        qs = Driver.objects.filter(license_number=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise ValidationError('A driver with this license number already exists.')
        return value

    def validate(self, data):
        if not self.instance:  # create
            required = ['username', 'password', 'license_number', 'license_expiry', 'phone']
            for field in required:
                if not data.get(field):
                    raise serializers.ValidationError({field: 'This field is required.'})
        return data
