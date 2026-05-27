from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Customer
from .serializers import CustomerReadSerializer, CustomerWriteSerializer
from .services import CustomerService


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    permission_classes = [IsAuthenticated]

    filterset_fields = ['customer_type', 'city', 'country']
    search_fields = ['name', 'email', 'phone']
    ordering_fields = ['name', 'created_at']

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return CustomerReadSerializer
        return CustomerWriteSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = CustomerService.create_customer(serializer.validated_data)
        return Response(CustomerReadSerializer(customer).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        customer = CustomerService.update_customer(instance, serializer.validated_data)
        return Response(CustomerReadSerializer(customer).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        CustomerService.delete_customer(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
