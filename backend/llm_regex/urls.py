from django.urls import path
from .views import RegexProcessView, HealthCheck

urlpatterns = [
    path('process-text/', RegexProcessView.as_view(), name='process_text_api'),
    path('', HealthCheck.as_view(), name='health_check_api'),
]