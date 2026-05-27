from .base import *
import dj_database_url
from decouple import config

DEBUG = False

DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL'),
        conn_max_age=600,
        ssl_require=True,
    )
}

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='', cast=lambda v: [s.strip() for s in v.split(',') if s.strip()])

SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
