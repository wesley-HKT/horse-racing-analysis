"""
配置文件管理
"""
import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, validator
from dotenv import load_dotenv

# 加載環境變量
load_dotenv()

class Settings(BaseSettings):
    """應用設置"""
    
    # API配置
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # 數據庫配置
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost:5432/horse_racing"
    )
    
    # Redis配置
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # 安全配置
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "jwt-secret-key-here")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # CORS配置
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://horseracing.ai",
        "https://www.horseracing.ai",
    ]
    
    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, tuple)):
            return list(v)
        return v
    
    # API密鑰配置
    RACING_API_KEY: Optional[str] = os.getenv("RACING_API_KEY")
    WEATHER_API_KEY: Optional[str] = os.getenv("WEATHER_API_KEY")
    ODDS_API_KEY: Optional[str] = os.getenv("ODDS_API_KEY")
    
    # AI模型配置
    MODEL_PATH: str = os.getenv("MODEL_PATH", "./ai/models")
    MODEL_VERSION: str = os.getenv("MODEL_VERSION", "v1.0.0")
    
    # 數據路徑
    DATA_PATH: str = os.getenv("DATA_PATH", "./data")
    
    # 日誌配置
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: Optional[str] = os.getenv("LOG_FILE")
    
    # 緩存配置
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "300"))  # 5分鐘
    CACHE_MAX_SIZE: int = int(os.getenv("CACHE_MAX_SIZE", "1000"))
    
    # 性能配置
    WORKERS: int = int(os.getenv("WORKERS", "4"))
    MAX_CONNECTIONS: int = int(os.getenv("MAX_CONNECTIONS", "100"))
    
    # 監控配置
    METRICS_ENABLED: bool = os.getenv("METRICS_ENABLED", "True").lower() == "true"
    SENTRY_DSN: Optional[str] = os.getenv("SENTRY_DSN")
    
    # 任務隊列配置
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", REDIS_URL)
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL)
    
    # 郵件配置
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    EMAIL_FROM: Optional[str] = os.getenv("EMAIL_FROM")
    
    # 文件上傳配置
    MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", "10485760"))  # 10MB
    ALLOWED_EXTENSIONS: List[str] = ["csv", "json", "xlsx", "parquet"]
    
    # 速率限制
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    RATE_LIMIT_PER_HOUR: int = int(os.getenv("RATE_LIMIT_PER_HOUR", "1000"))
    
    # 特徵配置
    FEATURE_COLUMNS: List[str] = [
        "horse_age",
        "horse_weight",
        "jockey_win_rate",
        "trainer_win_rate",
        "distance_preference",
        "track_preference",
        "recent_form",
        "prize_money",
        "handicap",
        "draw",
        "going",
        "weather",
        "temperature",
    ]
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"

# 全局設置實例
settings = Settings()

# 數據庫連接配置
DATABASE_CONFIG = {
    "url": settings.DATABASE_URL,
    "echo": settings.DEBUG,
    "pool_size": settings.MAX_CONNECTIONS,
    "max_overflow": 20,
    "pool_pre_ping": True,
    "pool_recycle": 3600,  # 1小時
}

# Redis配置
REDIS_CONFIG = {
    "url": settings.REDIS_URL,
    "decode_responses": True,
    "socket_keepalive": True,
    "socket_timeout": 5,
}

# Celery配置
CELERY_CONFIG = {
    "broker_url": settings.CELERY_BROKER_URL,
    "result_backend": settings.CELERY_RESULT_BACKEND,
    "task_serializer": "json",
    "result_serializer": "json",
    "accept_content": ["json"],
    "timezone": "Asia/Hong_Kong",
    "enable_utc": True,
    "task_track_started": True,
    "task_time_limit": 30 * 60,  # 30分鐘
    "task_soft_time_limit": 25 * 60,  # 25分鐘
    "worker_max_tasks_per_child": 1000,
    "worker_prefetch_multiplier": 1,
}

# 日誌配置
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "simple": {
            "format": "%(levelname)s %(message)s",
        },
    },
    "handlers": {
        "console": {
            "level": settings.LOG_LEVEL,
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "": {
            "handlers": ["console"],
            "level": settings.LOG_LEVEL,
            "propagate": True,
        },
        "uvicorn": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "sqlalchemy": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}