from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_payload = {
            'error': {
                'code': _get_error_code(response.status_code),
                'message': _get_error_message(response.data),
                'details': response.data if isinstance(response.data, dict) else {'non_field_errors': response.data},
            }
        }
        response.data = error_payload

    return response


def _get_error_code(status_code):
    codes = {
        400: 'validation_error',
        401: 'authentication_required',
        403: 'permission_denied',
        404: 'not_found',
        405: 'method_not_allowed',
        409: 'conflict',
        500: 'server_error',
    }
    return codes.get(status_code, 'error')


def _get_error_message(data):
    if isinstance(data, dict):
        if 'detail' in data:
            return str(data['detail'])
        return 'Datos inválidos'
    if isinstance(data, list) and data:
        return str(data[0])
    return 'Error en la solicitud'
