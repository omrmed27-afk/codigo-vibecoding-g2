from rest_framework import serializers
from customers.models import Customer
from warehouses.models import Warehouse
from transport.models import Transport
from routes.models import Route
from products.models import Product
from .models import Shipment, ShipmentProduct


class CustomerSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)


class ShipmentWarehouseSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    city = serializers.CharField(read_only=True)


class TransportSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    plate_number = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)


class RouteSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)


class ProductSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    sku = serializers.CharField(read_only=True)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)


class ShipmentProductReadSerializer(serializers.ModelSerializer):
    product = ProductSummarySerializer(read_only=True)

    class Meta:
        model = ShipmentProduct
        fields = ['id', 'product', 'quantity', 'unit_price_at_shipment', 'created_at']
        read_only_fields = ['id', 'created_at']


class ShipmentProductWriteSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    quantity = serializers.IntegerField(min_value=1)


class ShipmentReadSerializer(serializers.ModelSerializer):
    customer = CustomerSummarySerializer(read_only=True)
    origin_warehouse = ShipmentWarehouseSummarySerializer(read_only=True)
    transport = TransportSummarySerializer(read_only=True, allow_null=True)
    route = RouteSummarySerializer(read_only=True, allow_null=True)
    shipment_products = ShipmentProductReadSerializer(many=True, read_only=True)

    class Meta:
        model = Shipment
        fields = [
            'id', 'tracking_number', 'customer', 'origin_warehouse',
            'destination_address', 'destination_city', 'destination_country',
            'status', 'transport', 'route',
            'scheduled_delivery_date', 'actual_delivery_date',
            'weight_kg', 'base_cost', 'calculated_cost', 'notes',
            'shipment_products', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'tracking_number', 'status', 'base_cost',
            'calculated_cost', 'actual_delivery_date', 'created_at', 'updated_at',
        ]


class ShipmentWriteSerializer(serializers.Serializer):
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all())
    origin_warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.all())
    destination_address = serializers.CharField(max_length=500)
    destination_city = serializers.CharField(max_length=100)
    destination_country = serializers.CharField(max_length=100)
    scheduled_delivery_date = serializers.DateField()
    weight_kg = serializers.DecimalField(max_digits=8, decimal_places=3)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None)
    products = ShipmentProductWriteSerializer(many=True)

    def validate_products(self, value):
        if not value:
            raise serializers.ValidationError('At least one product is required.')
        product_ids = [item['product'].id for item in value]
        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError('Duplicate products are not allowed in a shipment.')
        return value
