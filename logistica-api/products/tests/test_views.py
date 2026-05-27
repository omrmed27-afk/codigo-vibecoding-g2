"""
Tests for products.views — ProductViewSet endpoints.
Covers happy path, unhappy path, and edge cases.
All endpoints require IsAuthenticated; tests use force_authenticate.
Base URL: /api/products/
"""
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from suppliers.models import Supplier
from warehouses.models import Warehouse
from products.models import Product


# ── Shared helpers ────────────────────────────────────────────────────────────

def make_supplier(suffix=''):
    return Supplier.objects.create(
        name=f'View Supplier{suffix}',
        contact_name='Alice',
        email=f'view_supplier{suffix}@test.com',
        phone='600700800',
        address='1 Main St',
        city='Bogota',
        country='Colombia',
    )


def make_warehouse(suffix=''):
    return Warehouse.objects.create(
        name=f'View Warehouse{suffix}',
        address='2 Storage Rd',
        city='Cali',
        country='Colombia',
    )


def make_product(supplier, warehouse, sku='VIEW-001', name='Webcam'):
    return Product.objects.create(
        name=name,
        sku=sku,
        weight_kg=Decimal('0.250'),
        width_cm=Decimal('8.00'),
        height_cm=Decimal('6.00'),
        depth_cm=Decimal('5.00'),
        unit_price=Decimal('89.99'),
        stock_quantity=30,
        supplier=supplier,
        warehouse=warehouse,
    )


VALID_PAYLOAD = {
    'name': 'USB Hub',
    'sku': 'HUB-001',
    'weight_kg': '0.300',
    'width_cm': '12.00',
    'height_cm': '3.00',
    'depth_cm': '8.00',
    'unit_price': '29.99',
    'stock_quantity': 15,
}

BASE_URL = '/api/products/'


def detail_url(pk):
    return f'{BASE_URL}{pk}/'


# ── List endpoint ─────────────────────────────────────────────────────────────

class ProductListTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.supplier = make_supplier()
        self.warehouse = make_warehouse()

    def test_list_returns_200(self):
        """GET /api/products/ returns 200 OK."""
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_empty_returns_empty_results(self):
        """GET /api/products/ with no products returns empty results list."""
        response = self.client.get(BASE_URL)
        self.assertEqual(response.data['results'], [])

    def test_list_returns_created_product(self):
        """GET /api/products/ includes existing products."""
        make_product(self.supplier, self.warehouse)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(len(response.data['results']), 1)

    def test_list_unauthenticated_returns_401(self):
        """GET /api/products/ without auth → 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_response_has_pagination_fields(self):
        """Response includes count, next, previous, results (pagination)."""
        response = self.client.get(BASE_URL)
        for field in ('count', 'next', 'previous', 'results'):
            self.assertIn(field, response.data)

    def test_list_product_has_nested_supplier_and_warehouse(self):
        """Each product in list has nested supplier and warehouse objects."""
        make_product(self.supplier, self.warehouse)
        response = self.client.get(BASE_URL)
        product_data = response.data['results'][0]
        self.assertIsInstance(product_data['supplier'], dict)
        self.assertIsInstance(product_data['warehouse'], dict)
        self.assertIn('id', product_data['supplier'])
        self.assertIn('name', product_data['supplier'])


# ── Create endpoint ───────────────────────────────────────────────────────────

class ProductCreateTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.supplier = make_supplier()
        self.warehouse = make_warehouse()

    def _payload(self, **overrides):
        data = {
            **VALID_PAYLOAD,
            'supplier': self.supplier.pk,
            'warehouse': self.warehouse.pk,
        }
        data.update(overrides)
        return data

    def test_create_returns_201(self):
        """POST /api/products/ with valid data → 201 Created."""
        response = self.client.post(BASE_URL, self._payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_returns_product_data(self):
        """POST response body contains the created product with nested supplier/warehouse."""
        response = self.client.post(BASE_URL, self._payload(), format='json')
        self.assertEqual(response.data['name'], 'USB Hub')
        self.assertEqual(response.data['sku'], 'HUB-001')
        self.assertIsInstance(response.data['supplier'], dict)
        self.assertIsInstance(response.data['warehouse'], dict)

    def test_create_persists_product(self):
        """Product is persisted to the database after POST."""
        self.client.post(BASE_URL, self._payload(), format='json')
        self.assertEqual(Product.objects.filter(sku='HUB-001').count(), 1)

    def test_create_without_name_returns_400(self):
        """POST without name → 400 Bad Request."""
        data = self._payload()
        del data['name']
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_without_sku_returns_400(self):
        """POST without sku → 400 Bad Request."""
        data = self._payload()
        del data['sku']
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_without_weight_kg_returns_400(self):
        """POST without weight_kg → 400."""
        data = self._payload()
        del data['weight_kg']
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_without_supplier_returns_400(self):
        """POST without supplier FK → 400."""
        data = self._payload()
        del data['supplier']
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_without_warehouse_returns_400(self):
        """POST without warehouse FK → 400."""
        data = self._payload()
        del data['warehouse']
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_with_invalid_supplier_pk_returns_400(self):
        """POST with non-existent supplier → 400."""
        response = self.client.post(BASE_URL, self._payload(supplier=99999), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_with_invalid_warehouse_pk_returns_400(self):
        """POST with non-existent warehouse → 400."""
        response = self.client.post(BASE_URL, self._payload(warehouse=99999), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_with_duplicate_sku_returns_400(self):
        """POST with an already-used SKU → 400."""
        make_product(self.supplier, self.warehouse, sku='HUB-001')
        response = self.client.post(BASE_URL, self._payload(sku='HUB-001'), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_with_non_numeric_weight_returns_400(self):
        """POST with non-numeric weight_kg → 400."""
        response = self.client.post(BASE_URL, self._payload(weight_kg='not-a-number'), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_without_description_returns_201(self):
        """POST without optional description field → 201."""
        data = self._payload()
        data.pop('description', None)
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_unauthenticated_returns_401(self):
        """POST without auth → 401."""
        self.client.force_authenticate(user=None)
        response = self.client.post(BASE_URL, self._payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_default_stock_quantity_zero(self):
        """POST without stock_quantity → defaults to 0."""
        data = self._payload(sku='NOSTOCK-001')
        data.pop('stock_quantity', None)
        response = self.client.post(BASE_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['stock_quantity'], 0)

    def test_error_response_format(self):
        """400 response follows the project error envelope format."""
        data = self._payload()
        del data['name']
        response = self.client.post(BASE_URL, data, format='json')
        self.assertIn('error', response.data)
        self.assertIn('code', response.data['error'])
        self.assertIn('message', response.data['error'])
        self.assertIn('details', response.data['error'])


# ── Retrieve endpoint ─────────────────────────────────────────────────────────

class ProductRetrieveTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.supplier = make_supplier()
        self.warehouse = make_warehouse()
        self.product = make_product(self.supplier, self.warehouse)

    def test_retrieve_returns_200(self):
        """GET /api/products/<id>/ returns 200."""
        response = self.client.get(detail_url(self.product.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_product(self):
        """GET returns the correct product data."""
        response = self.client.get(detail_url(self.product.pk))
        self.assertEqual(response.data['id'], self.product.pk)
        self.assertEqual(response.data['sku'], self.product.sku)

    def test_retrieve_includes_nested_relations(self):
        """GET single product includes nested supplier and warehouse."""
        response = self.client.get(detail_url(self.product.pk))
        self.assertIsInstance(response.data['supplier'], dict)
        self.assertIsInstance(response.data['warehouse'], dict)

    def test_retrieve_nonexistent_returns_404(self):
        """GET /api/products/9999/ → 404."""
        response = self.client.get(detail_url(9999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unauthenticated_returns_401(self):
        """GET without auth → 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(detail_url(self.product.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ── Update endpoint ───────────────────────────────────────────────────────────

class ProductUpdateTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.supplier = make_supplier()
        self.warehouse = make_warehouse()
        self.product = make_product(self.supplier, self.warehouse)

    def _full_payload(self, **overrides):
        data = {
            'name': 'Updated Webcam',
            'sku': self.product.sku,
            'weight_kg': '0.250',
            'width_cm': '8.00',
            'height_cm': '6.00',
            'depth_cm': '5.00',
            'unit_price': '99.99',
            'stock_quantity': 25,
            'supplier': self.supplier.pk,
            'warehouse': self.warehouse.pk,
        }
        data.update(overrides)
        return data

    def test_put_returns_200(self):
        """PUT /api/products/<id>/ with valid full data → 200."""
        response = self.client.put(detail_url(self.product.pk), self._full_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_put_updates_product_name(self):
        """PUT updates the product name in the database."""
        self.client.put(detail_url(self.product.pk), self._full_payload(name='New Name'), format='json')
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, 'New Name')

    def test_patch_updates_only_provided_field(self):
        """PATCH with only unit_price updates that field, leaving others unchanged."""
        original_name = self.product.name
        response = self.client.patch(
            detail_url(self.product.pk),
            {'unit_price': '199.99'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, original_name)
        self.assertEqual(self.product.unit_price, Decimal('199.99'))

    def test_put_nonexistent_returns_404(self):
        """PUT /api/products/9999/ → 404."""
        response = self.client.put(detail_url(9999), self._full_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_put_duplicate_sku_returns_400(self):
        """PUT with SKU that belongs to another product → 400."""
        other = make_product(self.supplier, self.warehouse, sku='OTHER-SKU')
        response = self.client.put(
            detail_url(self.product.pk),
            self._full_payload(sku='OTHER-SKU'),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_put_same_sku_on_own_product_returns_200(self):
        """PUT keeping own SKU on the same product → 200 (not a duplicate)."""
        response = self.client.put(
            detail_url(self.product.pk),
            self._full_payload(),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_put_unauthenticated_returns_401(self):
        """PUT without auth → 401."""
        self.client.force_authenticate(user=None)
        response = self.client.put(detail_url(self.product.pk), self._full_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_put_response_has_nested_supplier_and_warehouse(self):
        """PUT response body contains nested supplier and warehouse objects."""
        response = self.client.put(detail_url(self.product.pk), self._full_payload(), format='json')
        self.assertIsInstance(response.data['supplier'], dict)
        self.assertIsInstance(response.data['warehouse'], dict)


# ── Delete endpoint ───────────────────────────────────────────────────────────

class ProductDeleteTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.supplier = make_supplier()
        self.warehouse = make_warehouse()

    def test_delete_returns_204(self):
        """DELETE /api/products/<id>/ → 204 No Content."""
        product = make_product(self.supplier, self.warehouse)
        response = self.client.delete(detail_url(product.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_product_from_db(self):
        """After DELETE, product no longer exists in the database."""
        product = make_product(self.supplier, self.warehouse)
        pk = product.pk
        self.client.delete(detail_url(pk))
        self.assertFalse(Product.objects.filter(pk=pk).exists())

    def test_delete_nonexistent_returns_404(self):
        """DELETE /api/products/9999/ → 404."""
        response = self.client.delete(detail_url(9999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated_returns_401(self):
        """DELETE without auth → 401."""
        product = make_product(self.supplier, self.warehouse, sku='AUTH-DEL')
        self.client.force_authenticate(user=None)
        response = self.client.delete(detail_url(product.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_protected_product_returns_400(self):
        """DELETE a product referenced by a shipment raises 400.

        The service catches ProtectedError and re-raises it as a DRF
        ValidationError, which the custom_exception_handler converts to 400.
        We mock delete_product to raise the DRF ValidationError directly,
        simulating the service behavior without needing a real shipment.
        """
        from unittest.mock import patch
        from rest_framework.exceptions import ValidationError as DRFValidationError
        from products.services import ProductService

        product = make_product(self.supplier, self.warehouse, sku='PROT-DEL')

        def mock_delete(instance):
            raise DRFValidationError(
                'Cannot delete product: it is referenced by existing shipments.'
            )

        with patch.object(ProductService, 'delete_product', staticmethod(mock_delete)):
            response = self.client.delete(detail_url(product.pk))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
