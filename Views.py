from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.response import Response

from .models import Student
from .serializers import StudentSerializer


class StudentViewSet(viewsets.ModelViewSet):
    """
    Provides full CRUD for the Student model:
      GET    /api/students/          -> list (supports ?search=&department=&year=)
      POST   /api/students/          -> create
      GET    /api/students/{id}/     -> retrieve
      PUT    /api/students/{id}/     -> update (full)
      PATCH  /api/students/{id}/     -> update (partial)
      DELETE /api/students/{id}/     -> delete
    """
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    def get_queryset(self):
        queryset = Student.objects.all()
        search = self.request.query_params.get('search')
        department = self.request.query_params.get('department')
        year = self.request.query_params.get('year')

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(roll_number__icontains=search) |
                Q(email__icontains=search)
            )
        if department:
            queryset = queryset.filter(department=department)
        if year:
            queryset = queryset.filter(year=year)

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        self.perform_create(serializer)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response(
                {"success": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        self.perform_update(serializer)
        return Response({"success": True, "data": serializer.data})

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"success": True, "message": "Student deleted successfully."},
            status=status.HTTP_200_OK
        )
      
