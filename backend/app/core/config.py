from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, AnyHttpUrl

class Settings(BaseSettings):
    PROJECT_NAME: str = "Fiixo"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = Field(default="development", description="development, test, or production")
    DEBUG: bool = Field(default=False)
    
    # Security
    SECRET_KEY: str = Field(default="fiixo_dev_super_secret_master_key_change_in_production_32b_min", description="Secret key for JWT generation")
    ENCRYPTION_KEY: str = Field(default="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", description="64-char hex key for AES-256 token encryption")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./fiixo_dev.db",
        description="Async database connection string (e.g. postgresql+asyncpg://user:pass@host:5432/fiixo or sqlite+aiosqlite:///./fiixo_dev.db)"
    )
    
    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    
    # GitHub Integration
    GITHUB_CLIENT_ID: Optional[str] = Field(default=None)
    GITHUB_CLIENT_SECRET: Optional[str] = Field(default=None)
    GITHUB_REDIRECT_URI: Optional[str] = Field(default=None)
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://fiixo.onrender.com"
    ]
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
