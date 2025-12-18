from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    MONGO_URI: str
    GEMINI_API_KEY: Optional[str] = None
    DATABASE_NAME: str = "deflogis"
    PINATA_JWT: Optional[str] = None
    ETHEREUM_RPC_URL: Optional[str] = None
    PRIVATE_KEY: Optional[str] = None
    CONTRACT_ADDRESS: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
