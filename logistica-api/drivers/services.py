from django.contrib.auth import get_user_model
from django.db import transaction

from .models import Driver

User = get_user_model()

USER_FIELDS = {'username', 'password', 'email', 'first_name', 'last_name'}


class DriverService:

    @staticmethod
    def create_driver_with_user(data: dict) -> Driver:
        user_data = {k: v for k, v in data.items() if k in USER_FIELDS}
        driver_data = {k: v for k, v in data.items() if k not in USER_FIELDS}
        with transaction.atomic():
            password = user_data.pop('password')
            user = User.objects.create_user(password=password, **user_data)
            driver = Driver.objects.create(user=user, **driver_data)
        return Driver.objects.select_related('user').get(pk=driver.pk)

    @staticmethod
    def update_driver_with_user(instance: Driver, data: dict) -> Driver:
        user_data = {k: v for k, v in data.items() if k in USER_FIELDS}
        driver_data = {k: v for k, v in data.items() if k not in USER_FIELDS}
        with transaction.atomic():
            if user_data:
                user = instance.user
                for field, value in user_data.items():
                    if field == 'password':
                        user.set_password(value)
                    else:
                        setattr(user, field, value)
                user.save()
            for field, value in driver_data.items():
                setattr(instance, field, value)
            instance.save()
        return Driver.objects.select_related('user').get(pk=instance.pk)

    @staticmethod
    def delete_driver(instance: Driver) -> None:
        instance.user.delete()
