from django.db import transaction, IntegrityError
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError

from .models import Route, RouteStop


class RouteService:

    @staticmethod
    def create_route(data: dict) -> Route:
        stops_data = data.pop('stops', [])
        with transaction.atomic():
            route = Route.objects.create(**data)
            for stop_data in stops_data:
                RouteStop.objects.create(route=route, **stop_data)
        return (
            Route.objects.select_related('origin_warehouse')
            .prefetch_related('stops')
            .get(pk=route.pk)
        )

    @staticmethod
    def update_route(instance: Route, data: dict) -> Route:
        stops_data = data.pop('stops', None)
        with transaction.atomic():
            for field, value in data.items():
                setattr(instance, field, value)
            instance.save()
            if stops_data is not None:
                instance.stops.all().delete()
                for stop_data in stops_data:
                    RouteStop.objects.create(route=instance, **stop_data)
        return (
            Route.objects.select_related('origin_warehouse')
            .prefetch_related('stops')
            .get(pk=instance.pk)
        )

    @staticmethod
    def delete_route(instance: Route) -> None:
        instance.delete()

    @staticmethod
    def add_stop(route: Route, data: dict) -> RouteStop:
        try:
            return RouteStop.objects.create(route=route, **data)
        except IntegrityError:
            raise ValidationError(
                'A stop with this order already exists for this route.'
            )

    @staticmethod
    def delete_stop(route: Route, stop_pk) -> None:
        stop = get_object_or_404(RouteStop, pk=stop_pk, route=route)
        stop.delete()

    @staticmethod
    def list_stops(route: Route):
        return route.stops.all()
