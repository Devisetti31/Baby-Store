from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from .models import UserProfile

AVATAR_CHOICES = [
    ('🦖', '🦖 Dino'),
    ('🧸', '🧸 Teddy'),
    ('🦄', '🦄 Unicorn'),
    ('🎈', '🎈 Balloon'),
    ('🫧', '🫧 Bubble'),
    ('🌟', '🌟 Star'),
]

class RegistrationForm(UserCreationForm):
    email = forms.EmailField(required=True, widget=forms.EmailInput(attrs={
        'class': 'form-input-field',
        'placeholder': 'Enter email address'
    }))
    first_name = forms.CharField(required=True, widget=forms.TextInput(attrs={
        'class': 'form-input-field',
        'placeholder': 'Enter first name'
    }))
    last_name = forms.CharField(required=True, widget=forms.TextInput(attrs={
        'class': 'form-input-field',
        'placeholder': 'Enter last name'
    }))
    phone = forms.CharField(required=False, widget=forms.TextInput(attrs={
        'class': 'form-input-field',
        'placeholder': 'Enter phone number'
    }))
    address = forms.CharField(required=False, widget=forms.Textarea(attrs={
        'class': 'form-textarea-field',
        'placeholder': 'Enter shipping address',
        'rows': 3
    }))
    avatar = forms.ChoiceField(choices=AVATAR_CHOICES, initial='🦖', widget=forms.Select(attrs={
        'class': 'form-select-field'
    }))

    class Meta(UserCreationForm.Meta):
        fields = UserCreationForm.Meta.fields + ('first_name', 'last_name', 'email')

    def save(self, commit=True):
        user = super().save(commit=commit)
        if commit:
            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.phone = self.cleaned_data.get('phone')
            profile.address = self.cleaned_data.get('address')
            profile.avatar = self.cleaned_data.get('avatar')
            profile.save()
        return user

class ProfileUpdateForm(forms.ModelForm):
    first_name = forms.CharField(required=True, widget=forms.TextInput(attrs={
        'class': 'form-input-field',
    }))
    last_name = forms.CharField(required=True, widget=forms.TextInput(attrs={
        'class': 'form-input-field',
    }))
    phone = forms.CharField(required=False, widget=forms.TextInput(attrs={
        'class': 'form-input-field',
    }))
    address = forms.CharField(required=False, widget=forms.Textarea(attrs={
        'class': 'form-textarea-field',
        'rows': 3
    }))
    avatar = forms.ChoiceField(choices=AVATAR_CHOICES, widget=forms.Select(attrs={
        'class': 'form-select-field'
    }))

    class Meta:
        model = User
        fields = ('first_name', 'last_name')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            profile, created = UserProfile.objects.get_or_create(user=self.instance)
            self.fields['phone'].initial = profile.phone
            self.fields['address'].initial = profile.address
            self.fields['avatar'].initial = profile.avatar

    def save(self, commit=True):
        user = super().save(commit=commit)
        if commit:
            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.phone = self.cleaned_data.get('phone')
            profile.address = self.cleaned_data.get('address')
            profile.avatar = self.cleaned_data.get('avatar')
            profile.save()
        return user
