"""
Shared setUp helpers for shipments tests.

Creates the full dependency chain required by Shipment/ShipmentProduct:
  auth.User -> Warehouse -> Supplier -> Customer -> Product
  auth.User (driver_user) -> Driver -> Transport
  Route (needs Warehouse)
  Shipment (needs Customer + Warehouse)
  ShipmentProduct (needs Shipment + Product)
"""
import datetime
from decimal import Decimal

from django.contrib.auth.models import User

from customers.models import Customer
from drivers.models import Driver
from products.models import Product
from routes.models import Route
from shipments.models import Shipment, ShipmentProduct
from suppliers.models import Supplier
from transport.models import Transport
from warehouses.models import Warehouse


def make_warehouse(name='Main Warehouse', **kwargs):
    defaults = dict(
        name=name,
        address='123 Main St',
        city='Bogota',
        country='Colombia',
    )
    defaults.update(kwargs)
    return Warehouse.objects.create(**defaults)


def make_supplier(email='supplier@test.com', **kwargs):
    defaults = dict(
        name='Tech Supplier',
        contact_name='Jane Doe',
        email=email,
        phone='3001234567',
        address='456 Supplier Ave',
        city='Medellin',
        country='Colombia',
    )
    defaults.update(kwargs)
    return Supplier.objects.create(**defaults)


def make_customer(email='customer@test.com', **kwargs):
    defaults = dict(
        name='Acme Corp',
        customer_type=Customer.CustomerType.COMPANY,
        email=email,
        phone='3009876543',
        address='789 Client Blvd',
        city='Cali',
        country='Colombia',
    )
    defaults.update(kwargs)
    return Customer.objects.create(**defaults)


def make_product(supplier, warehouse, sku='LAPTOP-001', **kwargs):
    defaults = dict(
        name='Laptop Pro',
        sku=sku,
        weight_kg=Decimal('2.500'),
        width_cm=Decimal('35.00'),
        height_cm=Decimal('2.00'),
        depth_cm=Decimal('25.00'),
        unit_price=Decimal('1200.00'),
        stock_quantity=50,
        supplier=supplier,
        warehouse=warehouse,
    )
    defaults.update(kwargs)
    return Product.objects.create(**defaults)


def make_driver_user(username='driveruser', **kwargs):
    return User.objects.create_user(username=username, password='driverpass123')


def make_driver(user, license_number='LIC-001', **kwargs):
    defaults = dict(
        user=user,
        license_number=license_number,
        license_expiry=datetime.date(2030, 12, 31),
        phone='3111234567',
        status=Driver.DriverStatus.AVAILABLE,
    )
    defaults.update(kwargs)
    return Driver.objects.create(**defaults)


def make_transport(driver=None, plate_number='ABC-123', **kwargs):
    defaults = dict(
        name='Truck Alpha',
        type=Transport.TransportType.TRUCK,
        plate_number=plate_number,
        capacity_kg=Decimal('5000.00'),
        capacity_m3=Decimal('20.000'),
        driver=driver,
        status=Transport.TransportStatus.AVAILABLE,
    )
    defaults.update(kwargs)
    return Transport.objects.create(**defaults)


def make_route(warehouse, name='Route A', **kwargs):
    defaults = dict(
        name=name,
        origin_warehouse=warehouse,
        status=Route.RouteStatus.ACTIVE,
    )
    defaults.update(kwargs)
    return Route.objects.create(**defaults)


def make_shipment(customer, warehouse, tracking_number='SHIP-20260526-ABCD1234', **kwargs):
    defaults = dict(
        tracking_number=tracking_number,
        customer=customer,
        origin_warehouse=warehouse,
        destination_address='999 Destination Rd',
        destination_city='Barranquilla',
        destination_country='Colombia',
        status=Shipment.ShipmentStatus.PENDING,
        scheduled_delivery_date=datetime.date(2026, 6, 15),
        weight_kg=Decimal('5.000'),
        base_cost=Decimal('12.50'),
    )
    defaults.update(kwargs)
    return Shipment.objects.create(**defaults)


def make_shipment_product(shipment, product, quantity=1, **kwargs):
    defaults = dict(
        shipment=shipment,
        product=product,
        quantity=quantity,
        unit_price_at_shipment=product.unit_price,
    )
    defaults.update(kwargs)
    return ShipmentProduct.objects.create(**defaults)
