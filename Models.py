from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.db import models


class Student(models.Model):
    DEPARTMENT_CHOICES = [
        ('CSE', 'Computer Science'),
        ('ECE', 'Electronics & Communication'),
        ('MECH', 'Mechanical'),
        ('CIVIL', 'Civil'),
        ('EEE', 'Electrical & Electronics'),
        ('IT', 'Information Technology'),
        ('OTHER', 'Other'),
    ]

    phone_validator = RegexValidator(
        regex=r'^\+?\d{7,15}$',
        message="Phone number must contain 7-15 digits, optionally prefixed with '+'."
    )

    roll_number = models.CharField(
        max_length=20,
        unique=True,
        help_text="Unique roll/registration number."
    )
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(
        max_length=16,
        validators=[phone_validator],
        blank=True,
        default=''
    )
    department = models.CharField(
        max_length=10,
        choices=DEPARTMENT_CHOICES,
        default='OTHER'
    )
    year = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(6)],
        help_text="Year of study (1-6)."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['roll_number']

    def __str__(self):
        return f"{self.roll_number} - {self.name}"
