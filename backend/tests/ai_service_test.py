# tests/ai_service_test.py
import pytest
from unittest.mock import patch, MagicMock
from app.services.ai_service import (
    generate_summary,
    generate_experience_description,
    generate_project_description
)

# =========================================================
# HELPER: Build a fake Groq client response
# =========================================================
def get_fake_groq_client():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_message = MagicMock()
    
    # This is the fake string the AI will "return"
    mock_message.content = "  This is a fake AI generated text!  "
    
    # Chain the mocks together exactly how Groq formats its response
    mock_response.choices = [MagicMock(message=mock_message)]
    mock_client.chat.completions.create.return_value = mock_response
    
    return mock_client

# =========================================================
# 1. TEST HAPPY PATHS (Successful AI Generation)
# =========================================================
@patch("app.services.ai_service.Groq")
@patch("app.services.ai_service.os.getenv")
def test_generate_summary_success(mock_getenv, mock_groq):
    mock_getenv.return_value = "fake_api_key_123"
    mock_groq.return_value = get_fake_groq_client()
    
    result = generate_summary({"full_name": "Test Name", "professional_title": "Dev"})
    
    # Check if it stripped the extra spaces as programmed!
    assert result == "This is a fake AI generated text!"

@patch("app.services.ai_service.Groq")
@patch("app.services.ai_service.os.getenv")
def test_generate_experience_success(mock_getenv, mock_groq):
    mock_getenv.return_value = "fake_api_key_123"
    mock_groq.return_value = get_fake_groq_client()
    
    result = generate_experience_description({"role": "Dev", "company": "Tech"})
    assert result == "This is a fake AI generated text!"

@patch("app.services.ai_service.Groq")
@patch("app.services.ai_service.os.getenv")
def test_generate_project_success(mock_getenv, mock_groq):
    mock_getenv.return_value = "fake_api_key_123"
    mock_groq.return_value = get_fake_groq_client()
    
    result = generate_project_description({"title": "App", "tech_stack": "Python"})
    assert result == "This is a fake AI generated text!"

# =========================================================
# 2. THE CHAOS MONKEY (Test Missing API Key)
# =========================================================
@patch("app.services.ai_service.os.getenv")
def test_missing_api_key_raises_error(mock_getenv):
    # Intentionally hide the API key
    mock_getenv.return_value = None
    
    # Assert that all three functions crash with the correct ValueError
    with pytest.raises(ValueError, match="GROQ_API_KEY is not set"):
        generate_summary({})
        
    with pytest.raises(ValueError, match="GROQ_API_KEY is not set"):
        generate_experience_description({})
        
    with pytest.raises(ValueError, match="GROQ_API_KEY is not set"):
        generate_project_description({})