from django.test import TestCase
from django.db import IntegrityError

from suppliers.models import Supplier


def make_supplier(**kwargs):
    defaults = {
        'name': 'Tech Supplier S.A.',
        'contact_name': 'Juan Perez',
        'email': 'contact@techsupplier.com',
        'phone': '+573001234567',
        'address': 'Calle 123 #45-67',
        'city': 'Bogota',
        'country': 'Colombia',
    }
    defaults.update(kwargs)
    return Supplier.objects.create(**defaults)


class SupplierModelCreationTest(TestCase):

    def test_create_supplier_with_all_required_fields(self):
        supplier = make_supplier()
        self.assertIsNotNone(supplier.pk)
        self.assertEqual(supplier.name, 'Tech Supplier S.A.')
        self.assertEqual(supplier.contact_name, 'Juan Perez')
        self.assertEqual(supplier.email, 'contact@techsupplier.com')
        self.assertEqual(supplier.phone, '+573001234567')
        self.assertEqual(supplier.address, 'Calle 123 #45-67')
        self.assertEqual(supplier.city, 'Bogota')
        self.assertEqual(supplier.country, 'Colombia')

    def test_created_at_is_set_automatically(self):
        supplier = make_supplier()
        self.assertIsNotNone(supplier.created_at)

    def test_updated_at_is_set_automatically(self):
        supplier = make_supplier()
        self.assertIsNotNone(supplier.updated_at)

    def test_str_returns_supplier_name(self):
        supplier = make_supplier(name='Global Tech')
        self.assertEqual(str(supplier), 'Global Tech')


class SupplierModelUniquenessTest(TestCase):

    def test_email_unique_constraint_raises_integrity_error(self):
        make_supplier(email='unique@test.com')
        with self.assertRaises(IntegrityError):
            make_supplier(email='unique@test.com', name='Another Supplier')

    def test_different_emails_allowed(self):
        s1 = make_supplier(email='first@test.com')
        s2 = make_supplier(email='second@test.com', name='Second Supplier')
        self.assertNotEqual(s1.pk, s2.pk)


class SupplierModelOrderingTest(TestCase):

    def test_meta_ordering_is_descending_created_at(self):
        """The model's Meta.ordering must be set to ['-created_at']."""
        self.assertEqual(Supplier._meta.ordering, ['-created_at'])

    def test_default_ordering_latest_supplier_appears_first(self):
        """
        When timestamps differ, the most recently created supplier appears first.
        We force different timestamps by saving with explicit created_at via
        update() after creation (auto_now_add cannot be overridden on create).
        Alternatively we verify by pk when timestamps are identical — SQLite may
        resolve ties by pk, so we guard with a timestamp-independent assertion.
        """
        import time
        s1 = make_supplier(email='a@test.com', name='A Supplier')
        time.sleep(0.01)  # ensure distinct created_at even on low-resolution clocks
        s2 = make_supplier(email='b@test.com', name='B Supplier')
        suppliers = list(Supplier.objects.all())
        # Most recently created must be first; if timestamps are equal, s2 has higher pk
        self.assertIn(suppliers[0].pk, [s1.pk, s2.pk])
        # At a minimum both suppliers are present
        pks = {s.pk for s in suppliers}
        self.assertIn(s1.pk, pks)
        self.assertIn(s2.pk, pks)
        # s2 should appear before s1 (created later)
        idx_s1 = next(i for i, s in enumerate(suppliers) if s.pk == s1.pk)
        idx_s2 = next(i for i, s in enumerate(suppliers) if s.pk == s2.pk)
        self.assertLess(idx_s2, idx_s1)
