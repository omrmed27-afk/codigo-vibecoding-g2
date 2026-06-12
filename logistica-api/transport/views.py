from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from core.permissions import StrictDjangoModelPermissions
from rest_framework.response import Response

from drivers.models import Driver
from .models import Transport
from .serializers import TransportReadSerializer, TransportWriteSerializer
from .services import TransportService


class TransportViewSet(viewsets.ModelViewSet):
    permission_classes = [StrictDjangoModelPermissions]
    filterset_fields = ['status', 'type', 'driver']
    search_fields = ['name', 'plate_number']
    ordering_fields = ['name', 'created_at', 'status']

    def get_queryset(self):
        return Transport.objects.select_related('driver').all()

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return TransportReadSerializer
        return TransportWriteSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        transport = TransportService.create_transport(serializer.validated_data)
        return Response(TransportReadSerializer(transport).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        transport = TransportService.update_transport(instance, serializer.validated_data)
        return Response(TransportReadSerializer(transport).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        TransportService.delete_transport(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='assign-driver')
    def assign_driver(self, request, pk=None):
        instance = self.get_object()
        driver_id = request.data.get('driver_id')
        if not driver_id:
            raise ValidationError({'driver_id': 'This field is required.'})
        driver = get_object_or_404(Driver, pk=driver_id)
        transport = TransportService.assign_driver(instance, driver)
        return Response(TransportReadSerializer(transport).data)

    @action(detail=True, methods=['post'], url_path='unassign-driver')
    def unassign_driver(self, request, pk=None):
        instance = self.get_object()
        transport = TransportService.unassign_driver(instance)
        return Response(TransportReadSerializer(transport).data)
