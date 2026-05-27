from rest_framework import serializers
from drivers.models import Driver
from .models import Transport


class DriverSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    license_number = serializers.CharField(read_only=True)
    phone = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)


class TransportReadSerializer(serializers.ModelSerializer):
    driver = DriverSummarySerializer(read_only=True, allow_null=True)

    class Meta:
        model = Transport
        fields = [
            'id', 'name', 'type', 'plate_number', 'capacity_kg',
            'capacity_m3', 'driver', 'status', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TransportWriteSerializer(serializers.ModelSerializer):
    driver = serializers.PrimaryKeyRelatedField(
        queryset=Driver.objects.all(),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Transport
        fields = [
            'name', 'type', 'plate_number', 'capacity_kg',
            'capacity_m3', 'driver', 'status',
        ]

    def validate_plate_number(self, value):
        qs = Transport.objects.filter(plate_number=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A transport with this plate number already exists.')
        return value
