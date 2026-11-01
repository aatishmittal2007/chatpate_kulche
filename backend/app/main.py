from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as core_router
from app.api.ai_endpoints import router as ai_router
from app.api.automation_endpoints import router as automation_router
from app.api.vehicle_endpoints import router as vehicle_router
from app.api.community_endpoints import router as community_router
from app.api.analytics_endpoints import router as analytics_router
from app.api.decision_endpoints import router as decision_router
from app.api.experiment_endpoints import router as experiment_router
from app.core.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist on startup
    init_db()
    yield

app = FastAPI(
    title="Diwali AirSense API",
    description="Multi-Source Air Quality Intelligence, Forecasting & Environmental Monitoring Platform",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(core_router)
app.include_router(ai_router)
app.include_router(automation_router)
app.include_router(vehicle_router)
app.include_router(community_router)
app.include_router(analytics_router)
app.include_router(decision_router)
app.include_router(experiment_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)
