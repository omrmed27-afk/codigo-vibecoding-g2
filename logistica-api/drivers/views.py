from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Driver
from .serializers import DriverReadSerializer, DriverWriteSerializer
from .services import DriverService


class DriverViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status']
    search_fields = ['user__username', 'user__email', 'license_number']
    ordering_fields = ['created_at', 'status']

    def get_queryset(self):
        return Driver.objects.select_related('user').all()

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return DriverReadSerializer
        return DriverWriteSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        driver = DriverService.create_driver_with_user(serializer.validated_data)
        return Response(DriverReadSerializer(driver).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        driver = DriverService.update_driver_with_user(instance, serializer.validated_data)
        return Response(DriverReadSerializer(driver).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        DriverService.delete_driver(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
