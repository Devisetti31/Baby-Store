# pyrefly: ignore [missing-import]
import json
import random
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from .models import UserProfile, Order
from .forms import RegistrationForm, ProfileUpdateForm

def home(request):
    return render(request, 'home.html') 

def collections(request):
    return render(request, 'collections.html')  

def new_arrivals(request):
    return render(request, 'new_arrivals.html') 

def reviews(request):
    return render(request, 'reviews.html')  

def about(request):
    return render(request, 'about.html')  

def contact(request):
    return render(request, 'contact.html') 

def cart(request):
    return render(request, 'cart.html')

def cloths(request):
    return render(request, 'cloths.html') 

def footwear(request):
    return render(request, 'footwear.html') 

def accessories(request):
    return render(request, 'accessories.html') 

def toys(request):
    return render(request, 'toys.html') 

def order_success(request):
    order_id = request.session.get('last_order_id')
    order = None
    if order_id:
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            pass
    return render(request, 'order_success.html', {'order': order}) 

def register_view(request):
    if request.user.is_authenticated:
        return redirect('profile')
    
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('profile')
    else:
        form = RegistrationForm()
    
    return render(request, 'register.html', {'form': form})

def login_view(request):
    if request.user.is_authenticated:
        return redirect('profile')
        
    next_url = request.GET.get('next', 'profile')
    
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            
            # If there is initial localStorage stars/level passed from registration/login form
            local_stars = request.POST.get('local_stars')
            local_level = request.POST.get('local_level')
            if local_stars and local_level:
                try:
                    profile = user.profile
                    # Sync local to db if db has default values (0 and 1)
                    if profile.stars == 0 and profile.level == 1:
                        profile.stars = int(local_stars)
                        profile.level = int(local_level)
                        profile.save()
                except Exception:
                    pass

            target = request.POST.get('next', 'profile')
            return redirect(target)
    else:
        form = AuthenticationForm()
        
    return render(request, 'login.html', {'form': form, 'next': next_url})

def logout_view(request):
    logout(request)
    return redirect('home')

@login_required(login_url='login')
def profile_view(request):
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'POST':
        form = ProfileUpdateForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            return redirect('profile')
    else:
        form = ProfileUpdateForm(instance=request.user)
        
    orders = request.user.orders.all().order_by('-created_at')
    
    return render(request, 'profile.html', {
        'form': form,
        'profile': profile,
        'orders': orders
    })

@login_required(login_url='login')
@require_POST
def checkout_view(request):
    cart_data = request.POST.get('cart_data', '[]')
    total_price_str = request.POST.get('total_price', '0.00')
    
    # Clean up price string
    clean_price = total_price_str.replace('$', '').replace('Rs.', '').replace(',', '').strip()
    try:
        total_price = float(clean_price)
    except ValueError:
        total_price = 0.00
        
    # Generate unique order number
    order_number = f"MK-{random.randint(100000, 999999)}"
    
    # Create order
    order = Order.objects.create(
        user=request.user,
        order_number=order_number,
        total_price=total_price,
        items_json=cart_data
    )
    
    # Award explorer stars for placing order
    profile = request.user.profile
    profile.stars += 50  # Extra +50 points for buying!
    if profile.stars >= 100:
        profile.level += profile.stars // 100
        profile.stars = profile.stars % 100
    profile.save()
    
    request.session['last_order_id'] = order.id
    return redirect('order_success')

@csrf_exempt
@require_POST
def sync_rewards_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'anonymous'})
        
    try:
        data = json.loads(request.body)
        stars = int(data.get('stars', 0))
        level = int(data.get('level', 1))
        
        profile = request.user.profile
        profile.stars = stars
        profile.level = level
        profile.save()
        
        return JsonResponse({
            'status': 'success',
            'stars': profile.stars,
            'level': profile.level
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)