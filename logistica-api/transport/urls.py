from rest_framework.routers import DefaultRouter
from .views import TransportViewSet

router = DefaultRouter()
router.register(r'transport', TransportViewSet, basename='transport')
urlpatterns = router.urls
