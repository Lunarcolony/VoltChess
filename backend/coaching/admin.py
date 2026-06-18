from django.contrib import admin

from .models import CoachMessage, LessonTemplate, TrainingPlan

admin.site.register(LessonTemplate)
admin.site.register(CoachMessage)
admin.site.register(TrainingPlan)
