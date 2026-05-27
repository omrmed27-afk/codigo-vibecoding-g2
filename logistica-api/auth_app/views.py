from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers as drf_serializers
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        request=RegisterSerializer,
        responses={
            201: inline_serializer(
                name='RegisterResponse',
                fields={
                    'access': drf_serializers.CharField(),
                    'refresh': drf_serializers.CharField(),
                    'user': inline_serializer(
                        name='RegisteredUser',
                        fields={
                            'id': drf_serializers.IntegerField(),
                            'username': drf_serializers.CharField(),
                            'email': drf_serializers.EmailField(),
                        },
                    ),
                },
            )
        },
        tags=['auth'],
        summary='Register a new user account',
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.create_user(**serializer.validated_data)
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                },
            },
            status=status.HTTP_201_CREATED,
        )
