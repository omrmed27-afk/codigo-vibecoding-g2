from rest_framework import viewsets, status
from core.permissions import StrictDjangoModelPermissions
from rest_framework.response import Response

from .models import Supplier
from .serializers import SupplierReadSerializer, SupplierWriteSerializer
from .services import SupplierService


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    permission_classes = [StrictDjangoModelPermissions]

    filterset_fields = ['city', 'country']
    search_fields = ['name', 'contact_name', 'email']
    ordering_fields = ['name', 'created_at']

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return SupplierReadSerializer
        return SupplierWriteSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        supplier = SupplierService.create_supplier(serializer.validated_data)
        return Response(SupplierReadSerializer(supplier).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        supplier = SupplierService.update_supplier(instance, serializer.validated_data)
        return Response(SupplierReadSerializer(supplier).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        SupplierService.delete_supplier(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
