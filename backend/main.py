"""
AI賽馬分析平台 - 後端API服務
"""
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi
from contextlib import asynccontextmanager
import logging
from typing import List, Optional
from datetime import datetime, timedelta

from .core.config import settings
from .api.v1 import api_router
from .core.database import engine, Base
from .services.data.racing_data import RacingDataService
from .ai.inference.predictor import RacingPredictor

# 配置日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    應用生命周期管理
    """
    # 啟動時
    logger.info("啟動AI賽馬分析API服務...")
    
    # 創建數據庫表
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("數據庫表創建完成")
    except Exception as e:
        logger.error(f"數據庫表創建失敗: {e}")
    
    # 初始化AI模型
    try:
        app.state.predictor = RacingPredictor()
        logger.info("AI模型加載完成")
    except Exception as e:
        logger.error(f"AI模型加載失敗: {e}")
        app.state.predictor = None
    
    # 初始化數據服務
    try:
        app.state.data_service = RacingDataService()
        logger.info("數據服務初始化完成")
    except Exception as e:
        logger.error(f"數據服務初始化失敗: {e}")
        app.state.data_service = None
    
    yield
    
    # 關閉時
    logger.info("關閉AI賽馬分析API服務...")
    if hasattr(app.state, 'predictor'):
        del app.state.predictor
    if hasattr(app.state, 'data_service'):
        del app.state.data_service

# 創建FastAPI應用
app = FastAPI(
    title="AI賽馬分析平台 API",
    description="基於大數據和機器學習的賽馬分析平台後端API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 註冊API路由
app.include_router(api_router, prefix="/api/v1")

# 健康檢查端點
@app.get("/health")
async def health_check():
    """
    健康檢查端點
    """
    status_info = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "services": {
            "database": "connected",
            "ai_model": "loaded" if hasattr(app.state, 'predictor') and app.state.predictor else "not_loaded",
            "data_service": "ready" if hasattr(app.state, 'data_service') and app.state.data_service else "not_ready",
        }
    }
    return JSONResponse(content=status_info)

@app.get("/health/db")
async def database_health_check():
    """
    數據庫健康檢查
    """
    try:
        # 簡單的數據庫查詢測試
        with engine.connect() as conn:
            result = conn.execute("SELECT 1")
            result.fetchone()
        
        return JSONResponse(content={
            "status": "connected",
            "timestamp": datetime.now().isoformat(),
        })
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"數據庫連接失敗: {str(e)}"
        )

# 示例數據端點
@app.get("/api/v1/races/today")
async def get_today_races():
    """
    獲取今日賽事
    """
    try:
        # 這裡應該從數據庫或API獲取真實數據
        # 目前返回示例數據
        today = datetime.now().date()
        
        example_races = [
            {
                "id": 1,
                "race_number": 1,
                "venue": "沙田",
                "distance": 1200,
                "track": "草地",
                "class": "四班",
                "start_time": f"{today}T14:00:00",
                "horses": 14,
                "prize": 1650000,
            },
            {
                "id": 2,
                "race_number": 2,
                "venue": "沙田",
                "distance": 1400,
                "track": "草地",
                "class": "三班",
                "start_time": f"{today}T14:30:00",
                "horses": 12,
                "prize": 2100000,
            },
            {
                "id": 3,
                "race_number": 3,
                "venue": "沙田",
                "distance": 1600,
                "track": "草地",
                "class": "二班",
                "start_time": f"{today}T15:00:00",
                "horses": 10,
                "prize": 2800000,
            },
        ]
        
        return {
            "date": today.isoformat(),
            "total_races": len(example_races),
            "races": example_races,
        }
    except Exception as e:
        logger.error(f"獲取今日賽事失敗: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="獲取賽事數據失敗"
        )

@app.get("/api/v1/predictions/{race_id}")
async def get_race_predictions(race_id: int):
    """
    獲取賽事預測
    """
    try:
        if not hasattr(app.state, 'predictor') or not app.state.predictor:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI模型未加載"
            )
        
        # 這裡應該調用真實的AI預測
        # 目前返回示例預測數據
        example_predictions = [
            {
                "horse_number": 1,
                "horse_name": "金鎗六十",
                "jockey": "潘頓",
                "trainer": "呂健威",
                "predicted_win_rate": 0.65,
                "predicted_place_rate": 0.85,
                "current_odds": 2.5,
                "value_rating": 0.8,
                "recommendation": "熱門"
            },
            {
                "horse_number": 2,
                "horse_name": "幸運傳奇",
                "jockey": "莫雷拉",
                "trainer": "蔡約翰",
                "predicted_win_rate": 0.35,
                "predicted_place_rate": 0.65,
                "current_odds": 8.0,
                "value_rating": 0.9,
                "recommendation": "價值投注"
            },
            {
                "horse_number": 3,
                "horse_name": "美麗傳承",
                "jockey": "巴度",
                "trainer": "大衛希斯",
                "predicted_win_rate": 0.25,
                "predicted_place_rate": 0.55,
                "current_odds": 12.0,
                "value_rating": 0.6,
                "recommendation": "冷門"
            },
        ]
        
        return {
            "race_id": race_id,
            "prediction_time": datetime.now().isoformat(),
            "total_horses": len(example_predictions),
            "predictions": example_predictions,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"獲取賽事預測失敗: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="獲取預測數據失敗"
        )

# 自定義OpenAPI文檔
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # 自定義文檔
    openapi_schema["info"]["contact"] = {
        "name": "AI賽馬分析團隊",
        "url": "https://github.com/yourusername/horse-racing-analysis",
        "email": "support@horseracing.ai",
    }
    
    openapi_schema["info"]["license"] = {
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level="info"
    )