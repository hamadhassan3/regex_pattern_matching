import re
import json
import google.generativeai as genai
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegexInputSerializer, RegexOutputSerializer
from google.generativeai import list_models


if settings.GOOGLE_API_KEY:
    genai.configure(api_key=settings.GOOGLE_API_KEY)
else:
    print("Warning: GOOGLE_API_KEY not found in settings.")


class HealthCheck(APIView):
    """
    Health check endpoint to verify that the API is running.

    Returns:
        200 OK with a status message if the server is healthy.
    """

    def get(self, request, *args, **kwargs):
        """
        Handle GET requests to the health check endpoint.

        Returns:
            Response: A JSON response indicating the server status.
        """
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


class RegexProcessView(APIView):
    """
    View to process text using a regex pattern generated by an LLM.
    This view takes a natural language query and data, generates a regex pattern using an LLM,
    and applies that regex to the data to produce a processed output.
    """

    def get_llm_generated_regex_pattern(self, natural_language_query, prompt):
        """
        Generate a regex pattern from a natural language query using the Gemini LLM.
        Args:
            natural_language_query (str): The natural language instruction for regex generation.
            regex_purpose_description (str): Description of the regex purpose to guide the LLM.
        Returns:
            str: The generated regex pattern.
        Raises:
            ValueError: If the LLM response is blocked, empty, or if the regex pattern is invalid.
        """

        if not settings.GOOGLE_API_KEY:
            raise ValueError("Google API key not configured.")

        try:
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            generation_config = genai.types.GenerationConfig(
                max_output_tokens=150,
                temperature=0.1
            )

            response = model.generate_content(
                prompt,
                generation_config=generation_config,
                safety_settings=[]
            )

            if not response.candidates:
                block_reason = "Unknown (no candidates)"
                if response.prompt_feedback and response.prompt_feedback.block_reason:
                    block_reason = response.prompt_feedback.block_reason.name
                raise ValueError(f"LLM response was blocked or empty. Reason: {block_reason}")

            regex_pattern = response.text.strip()
            
            if regex_pattern.startswith("```") and regex_pattern.endswith("```"):
                regex_pattern = regex_pattern[3:-3].strip()
            if regex_pattern.lower().startswith("regex pattern:"):
                regex_pattern = regex_pattern.split(":",1)[1].strip()
            if regex_pattern.lower().startswith("regex:"):
                regex_pattern = regex_pattern.split(":",1)[1].strip()

            return regex_pattern

        except Exception as e:
            print(f"Error communicating with Gemini API or processing its response: {e}")
            raise ValueError(f"Failed to get regex from LLM: {e}")

    def get_regex_from_llm(self, natural_language_query):
        """
        Generate a regex pattern from a natural language query using the Gemini LLM.
        Args:
            natural_language_query (str): The natural language instruction for regex generation.
        Returns:
            str: The generated regex pattern.
        Raises:
            ValueError: If the LLM response is blocked, empty, or if the regex pattern is invalid.
        """

        prompt_template = f"""
        Extract a Python-compatible regular expression from the natural language instruction. This regex should be
        able to match the specified patterns that the user wants to highlight or replace in their data.
        Only output the raw regex pattern itself, without any markdown, backticks, or explanations.
        Do not include the word "Regex:" or any other prefix.

        Instruction: "{natural_language_query}"
        Regex Pattern:
        """
        
        return self.get_llm_generated_regex_pattern(natural_language_query, prompt_template)
        
    def get_replacement_text_from_llm(self, natural_language_query):
        """
        Generate a replacement text from a natural language query using the Gemini LLM.
        Args:
            natural_language_query (str): The natural language instruction for replacement text generation.
        Returns:
            str: The generated replacement text.
        Raises:
            ValueError: If the LLM response is blocked, empty, or if the replacement text is invalid.
        """

        prompt_template = f"""
        Extract a Python-compatible regular expression from the natural language instruction.
        This regex should match the exact replacement text that the user wants to apply to their data.
        Only output the raw regex pattern itself, without any markdown, backticks, or explanations.
        Do not include the word "Regex:" or any other prefix.

        Instruction: "{natural_language_query}"
        Regex Pattern:
        """
        
        return self.get_llm_generated_regex_pattern(natural_language_query, prompt_template)

    def post(self, request, *args, **kwargs):
        """
        Handle POST requests to process data using a regex pattern generated by an LLM.
        Args:
            request (Request): The HTTP request containing the natural language query and data.
        Returns:
            Response: A JSON response containing the generated regex pattern, original data, processed data,
                      and a success message, or an error message if processing fails.
        """
        input_serializer = RegexInputSerializer(data=request.data)
        if not input_serializer.is_valid():
            return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = input_serializer.validated_data
        natural_language_query = validated_data.get('natural_language_query')
        data = validated_data.get('data')

        try:
            # Generate regex pattern and replacement text using the LLM
            generated_regex_pattern = self.get_regex_from_llm(natural_language_query)
            replacement_text = self.get_replacement_text_from_llm(natural_language_query)

            # Validate the generated regex pattern
            if not generated_regex_pattern:
                return Response(
                    {"error": "LLM did not return a regex pattern."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            try:
                # Compile the generated regex pattern to ensure it's valid
                compiled_regex = re.compile(generated_regex_pattern)
            except re.error as e:
                return Response(
                    {
                        "error": f"Invalid regex pattern generated by LLM: '{generated_regex_pattern}'. Details: {e}",
                        "generated_regex": generated_regex_pattern
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Convert JSON input to string for regex processing
            input_str = json.dumps(data)

            # Apply regex substitution
            processed_str = compiled_regex.sub(replacement_text, input_str)

            # Try to parse back to JSON, if possible
            try:
                processed_data = json.loads(processed_str)
            except json.JSONDecodeError:
                # If it cannot be parsed back to JSON, return the processed string as-is
                processed_data = processed_str

            # Prepare the output data
            output_data = {
                "generated_regex": generated_regex_pattern,
                "original_data": data,
                "processed_data": processed_data,
                "message": "Data processed successfully."
            }
            output_serializer = RegexOutputSerializer(data=output_data)
            output_serializer.is_valid(raise_exception=True)
            return Response(output_serializer.data, status=status.HTTP_200_OK)

        except ValueError as ve:
            return Response({"error": str(ve)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
