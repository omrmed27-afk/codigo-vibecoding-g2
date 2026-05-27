from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Product
from .serializers import ProductReadSerializer, ProductWriteSerializer
from .services import ProductService


class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    filterset_fields = ['supplier', 'warehouse']
    search_fields = ['name', 'sku', 'description']
    ordering_fields = ['name', 'unit_price', 'stock_quantity', 'created_at']

    def get_queryset(self):
        return Product.objects.select_related('supplier', 'warehouse').all()

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return ProductReadSerializer
        return ProductWriteSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = ProductService.create_product(serializer.validated_data)
        return Response(ProductReadSerializer(product).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        product = ProductService.update_product(instance, serializer.validated_data)
        return Response(ProductReadSerializer(product).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        ProductService.delete_product(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
