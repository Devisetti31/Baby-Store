"""
URL configuration for MK_Project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
# pyrefly: ignore [missing-import]
from . import views
urlpatterns = [
    path('', views.home, name='home'),
    path('admin/', admin.site.urls),
    path('collections/',views.collections,name='collections'),
    path('new_arrivals/',views.new_arrivals,name='new_arrivals'),
    path('reviews/',views.reviews,name='reviews'),
    path('about/',views.about,name='about'), 
    path('contact/',views.contact,name='contact'),
    path('cart/',views.cart,name='cart'),
    path('cloths/',views.cloths,name='cloths'),
    path('footwear/',views.footwear,name='footwear'),
    path('accessories/',views.accessories,name='accessories'),
    path('toys/',views.toys,name='toys'),
    path('order-success/', views.order_success, name='order_success'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),
    path('checkout/', views.checkout_view, name='checkout'),
    path('api/sync-rewards/', views.sync_rewards_view, name='sync_rewards'),
]
