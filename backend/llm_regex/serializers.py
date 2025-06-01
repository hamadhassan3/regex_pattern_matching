from rest_framework import serializers

class RegexInputSerializer(serializers.Serializer):
    natural_language_query = serializers.CharField(max_length=500)
    data = serializers.JSONField()
    replacement_text = serializers.CharField(allow_blank=True, required=False)

class RegexOutputSerializer(serializers.Serializer):
    generated_regex = serializers.CharField()
    original_data = serializers.JSONField()
    processed_data = serializers.JSONField()
    message = serializers.CharField(allow_blank=True, required=False)