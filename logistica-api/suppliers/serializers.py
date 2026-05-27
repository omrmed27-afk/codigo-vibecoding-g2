from rest_framework import serializers

from .models import Supplier


class SupplierReadSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Supplier
        fields = [
            'id',
            'name',
            'contact_name',
            'email',
            'phone',
            'address',
            'city',
            'country',
            'created_at',
            'updated_at',
        ]


class SupplierWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            'name',
            'contact_name',
            'email',
            'phone',
            'address',
            'city',
            'country',
        ]

    def validate_email(self, value):
        qs = Supplier.objects.filter(email=value)
        # On updates, exclude the current instance from the uniqueness check.
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                'A supplier with this email already exists.'
            )
        return value
