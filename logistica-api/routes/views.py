from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Route
from .serializers import (
    RouteReadSerializer,
    RouteWriteSerializer,
    RouteStopSerializer,
    RouteStopWriteSerializer,
)
from .services import RouteService


class RouteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'origin_warehouse']
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']

    def get_queryset(self):
        return (
            Route.objects.select_related('origin_warehouse')
            .prefetch_related('stops')
            .all()
        )

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return RouteReadSerializer
        return RouteWriteSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        route = RouteService.create_route(serializer.validated_data)
        return Response(RouteReadSerializer(route).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        route = RouteService.update_route(instance, serializer.validated_data)
        return Response(RouteReadSerializer(route).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        RouteService.delete_route(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(methods=['GET'], responses=RouteStopSerializer(many=True), summary='List stops for a route')
    @extend_schema(methods=['POST'], request=RouteStopWriteSerializer, responses={201: RouteStopSerializer}, summary='Add a stop to a route')
    @action(detail=True, methods=['get', 'post'], url_path='stops')
    def stops(self, request, pk=None):
        instance = self.get_object()
        if request.method == 'GET':
            stops = RouteService.list_stops(instance)
            return Response(RouteStopSerializer(stops, many=True).data)
        serializer = RouteStopWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        stop = RouteService.add_stop(instance, serializer.validated_data)
        return Response(RouteStopSerializer(stop).data, status=status.HTTP_201_CREATED)

    @extend_schema(
        parameters=[OpenApiParameter('stop_pk', int, OpenApiParameter.PATH, description='ID of the route stop')],
        responses={204: None},
        summary='Delete a specific stop from a route',
    )
    @action(detail=True, methods=['delete'], url_path='stops/(?P<stop_pk>[^/.]+)')
    def stop_detail(self, request, pk=None, stop_pk=None):
        instance = self.get_object()
        RouteService.delete_stop(instance, stop_pk)
        return Response(status=status.HTTP_204_NO_CONTENT)
