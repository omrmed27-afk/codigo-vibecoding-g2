from .models import Transport


class TransportService:

    @staticmethod
    def create_transport(data: dict) -> Transport:
        instance = Transport.objects.create(**data)
        return Transport.objects.select_related('driver').get(pk=instance.pk)

    @staticmethod
    def update_transport(instance: Transport, data: dict) -> Transport:
        for field, value in data.items():
            setattr(instance, field, value)
        instance.save()
        return Transport.objects.select_related('driver').get(pk=instance.pk)

    @staticmethod
    def delete_transport(instance: Transport) -> None:
        instance.delete()

    @staticmethod
    def assign_driver(instance: Transport, driver) -> Transport:
        instance.driver = driver
        instance.save()
        return Transport.objects.select_related('driver').get(pk=instance.pk)

    @staticmethod
    def unassign_driver(instance: Transport) -> Transport:
        instance.driver = None
        instance.save()
        return Transport.objects.select_related('driver').get(pk=instance.pk)
