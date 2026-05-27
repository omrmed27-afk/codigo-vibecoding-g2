from rest_framework import serializers

from suppliers.models import Supplier
from warehouses.models import Warehouse
from .models import Product


class SupplierSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name']


class WarehouseSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ['id', 'name']


class ProductReadSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    supplier = SupplierSummarySerializer(read_only=True)
    warehouse = WarehouseSummarySerializer(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'description',
            'sku',
            'weight_kg',
            'width_cm',
            'height_cm',
            'depth_cm',
            'unit_price',
            'stock_quantity',
            'supplier',
            'warehouse',
            'created_at',
            'updated_at',
        ]


class ProductWriteSerializer(serializers.ModelSerializer):
    supplier = serializers.PrimaryKeyRelatedField(queryset=Supplier.objects.all())
    warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.all())

    class Meta:
        model = Product
        fields = [
            'name',
            'description',
            'sku',
            'weight_kg',
            'width_cm',
            'height_cm',
            'depth_cm',
            'unit_price',
            'stock_quantity',
            'supplier',
            'warehouse',
        ]

    def validate_sku(self, value):
        qs = Product.objects.filter(sku=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A product with this SKU already exists.')
        return value
