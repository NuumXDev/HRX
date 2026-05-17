import os
from google import genai
from typing import Any, Optional
from dotenv import load_dotenv

load_dotenv()

class ModelClient:
    """
    Abstraction layer for AI models. 
    Currently defaults to Google Gemini but can be extended for other providers.
    """
    def __init__(self, api_key: Optional[str] = None, provider: str = "google"):
        self.provider = provider
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        
        if not self.api_key:
            raise ValueError("API Key not found for AI Engine.")

        if self.provider == "google":
            self.client = genai.Client(api_key=self.api_key)
        else:
            raise ValueError(f"Provider '{provider}' not supported yet.")

    def generate(self, model_name: str, contents: Any, config: Optional[dict] = None) -> Any:
        """Centralized generation method."""
        if self.provider == "google":
            return self.client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config
            )
        return None

    async def async_generate(self, model_name: str, contents: Any, config: Optional[dict] = None) -> Any:
        """Asynchronous generation method."""
        if self.provider == "google":
            return await self.client.aio.models.generate_content(
                model=model_name,
                contents=contents,
                config=config
            )
        return None

