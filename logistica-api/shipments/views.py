from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from routes.models import Route
from transport.models import Transport
from .models import Shipment
from .serializers import ShipmentReadSerializer, ShipmentWriteSerializer
from .services import ShipmentService


class ShipmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'customer', 'origin_warehouse', 'transport']
    search_fields = ['tracking_number', 'destination_city', 'destination_country']
    ordering_fields = ['created_at', 'scheduled_delivery_date', 'base_cost']

    def get_queryset(self):
        return (
            Shipment.objects
            .select_related('customer', 'origin_warehouse', 'transport', 'route')
            .prefetch_related('shipment_products__product')
            .all()
        )

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return ShipmentReadSerializer
        return ShipmentWriteSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shipment = ShipmentService.create_shipment(serializer.validated_data)
        return Response(ShipmentReadSerializer(shipment).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        shipment = ShipmentService.update_shipment(instance, serializer.validated_data)
        return Response(ShipmentReadSerializer(shipment).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        ShipmentService.delete_shipment(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='assign-transport')
    def assign_transport(self, request, pk=None):
        instance = self.get_object()
        transport_id = request.data.get('transport_id')
        if not transport_id:
            raise ValidationError({'transport_id': 'This field is required.'})
        transport = get_object_or_404(Transport, pk=transport_id)
        route = None
        route_id = request.data.get('route_id')
        if route_id:
            route = get_object_or_404(Route, pk=route_id)
        shipment = ShipmentService.assign_transport(instance, transport, route)
        return Response(ShipmentReadSerializer(shipment).data)

    @action(detail=True, methods=['post'], url_path='mark-delivered')
    def mark_delivered(self, request, pk=None):
        instance = self.get_object()
        shipment = ShipmentService.mark_delivered(instance)
        return Response(ShipmentReadSerializer(shipment).data)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        instance = self.get_object()
        shipment = ShipmentService.cancel_shipment(instance)
        return Response(ShipmentReadSerializer(shipment).data)
