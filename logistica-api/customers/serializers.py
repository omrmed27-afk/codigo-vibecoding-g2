from rest_framework import serializers

from .models import Customer


class CustomerReadSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id',
            'name',
            'customer_type',
            'email',
            'phone',
            'address',
            'city',
            'country',
            'tax_id',
            'created_at',
            'updated_at',
        ]


class CustomerWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'name',
            'customer_type',
            'email',
            'phone',
            'address',
            'city',
            'country',
            'tax_id',
        ]

    def validate_email(self, value):
        qs = Customer.objects.filter(email=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                'A customer with this email already exists.'
            )
        return value

    def validate_tax_id(self, value):
        if value is None or value == '':
            return value
        qs = Customer.objects.filter(tax_id=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                'A customer with this tax ID already exists.'
            )
        return value
