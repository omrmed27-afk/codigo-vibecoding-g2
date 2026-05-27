from rest_framework import serializers
from warehouses.models import Warehouse
from .models import Route, RouteStop


class RouteWarehouseSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)


class RouteStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteStop
        fields = ['id', 'stop_order', 'address', 'city', 'latitude', 'longitude', 'created_at']
        read_only_fields = ['id', 'created_at']


class RouteStopWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteStop
        fields = ['stop_order', 'address', 'city', 'latitude', 'longitude']


class RouteReadSerializer(serializers.ModelSerializer):
    origin_warehouse = RouteWarehouseSummarySerializer(read_only=True)
    stops = RouteStopSerializer(many=True, read_only=True)

    class Meta:
        model = Route
        fields = [
            'id', 'name', 'origin_warehouse', 'status',
            'stops', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RouteWriteSerializer(serializers.ModelSerializer):
    origin_warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.all())
    stops = RouteStopWriteSerializer(many=True, required=False, default=list)

    class Meta:
        model = Route
        fields = ['name', 'origin_warehouse', 'status', 'stops']
