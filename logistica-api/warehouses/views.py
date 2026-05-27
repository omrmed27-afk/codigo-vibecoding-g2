from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Warehouse
from .serializers import WarehouseReadSerializer, WarehouseWriteSerializer
from .services import WarehouseService


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    permission_classes = [IsAuthenticated]

    filterset_fields = ['is_active', 'city', 'country']
    search_fields = ['name', 'address', 'city']
    ordering_fields = ['name', 'created_at']

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return WarehouseReadSerializer
        return WarehouseWriteSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        warehouse = WarehouseService.create_warehouse(serializer.validated_data)
        return Response(WarehouseReadSerializer(warehouse).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        warehouse = WarehouseService.update_warehouse(instance, serializer.validated_data)
        return Response(WarehouseReadSerializer(warehouse).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        WarehouseService.delete_warehouse(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
