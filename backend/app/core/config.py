from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "HRX Platform"
    API_V1_STR: str = "/api/v1"
    ASSESSMENT_MODEL: str = "gemini-2.5-flash"
    
settings = Settings()
