from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MetraLab"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://metralab:metralab@localhost:5432/metralab"
    session_secret: str = "change-me-in-environment"
    session_cookie_name: str = "metralab_session"
    session_expiry_minutes: int = 480
    allowed_origins: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
