import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Student',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('roll_number', models.CharField(help_text='Unique roll/registration number.', max_length=20, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('phone', models.CharField(blank=True, default='', max_length=16, validators=[django.core.validators.RegexValidator(message="Phone number must contain 7-15 digits, optionally prefixed with '+'.", regex='^\\+?\\d{7,15}$')])),
                ('department', models.CharField(choices=[('CSE', 'Computer Science'), ('ECE', 'Electronics & Communication'), ('MECH', 'Mechanical'), ('CIVIL', 'Civil'), ('EEE', 'Electrical & Electronics'), ('IT', 'Information Technology'), ('OTHER', 'Other')], default='OTHER', max_length=10)),
                ('year', models.PositiveSmallIntegerField(help_text='Year of study (1-6).', validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(6)])),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['roll_number'],
            },
        ),
    ]
  
