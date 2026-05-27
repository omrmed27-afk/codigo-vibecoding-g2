from decimal import Decimal
from rest_framework import serializers
from .models import Warehouse


class WarehouseReadSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Warehouse
        fields = [
            'id',
            'name',
            'address',
            'city',
            'country',
            'latitude',
            'longitude',
            'is_active',
            'created_at',
            'updated_at',
        ]


class WarehouseWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = [
            'name',
            'address',
            'city',
            'country',
            'latitude',
            'longitude',
            'is_active',
        ]

    def validate_latitude(self, value):
        if value is not None and not (Decimal('-90') <= value <= Decimal('90')):
            raise serializers.ValidationError(
                'Latitude must be between -90 and 90.'
            )
        return value

    def validate_longitude(self, value):
        if value is not None and not (Decimal('-180') <= value <= Decimal('180')):
            raise serializers.ValidationError(
                'Longitude must be between -180 and 180.'
            )
        return value

    def validate(self, attrs):
        latitude = attrs.get('latitude')
        longitude = attrs.get('longitude')

        if latitude is not None and longitude is None:
            raise serializers.ValidationError(
                {'longitude': 'Longitude is required when latitude is provided.'}
            )
        if longitude is not None and latitude is None:
            raise serializers.ValidationError(
                {'latitude': 'Latitude is required when longitude is provided.'}
            )

        return attrs
