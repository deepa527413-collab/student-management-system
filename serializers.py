from rest_framework import serializers
from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = [
            'id', 'roll_number', 'name', 'email', 'phone',
            'department', 'year', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_roll_number(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Roll number cannot be empty.")
        return value

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Name cannot be empty.")
        if len(value) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters.")
        return value

    def validate_year(self, value):
        if value < 1 or value > 6:
            raise serializers.ValidationError("Year must be between 1 and 6.")
        return value
