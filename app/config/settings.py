"""
Configuration settings for the KASI Portfolio Demo
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings"""
    
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8000").split(",")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


settings = Settings()
