from typing import List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, Body

from app.services.vehicle_service import vehicle_service
from app.schemas.advanced_schemas import (
    VehicleDetectResponse,
    RoadCorridorSchema,
    RouteExposureRequest,
    RouteExposureResponse
)

router = APIRouter(prefix="/api/vehicles", tags=["Vehicle Intelligence & Corridors"])

@router.post("/detect", response_model=VehicleDetectResponse)
def post_vehicle_detection(
    duration_seconds: int = Query(30, ge=5, le=300, description="Sampling window duration in seconds")
):
    try:
        return vehicle_service.detect_vehicles_in_sample(duration_sec=duration_seconds)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vehicle detection failed: {str(e)}")

@router.get("/road-segments", response_model=List[RoadCorridorSchema])
def get_road_corridors():
    try:
        return vehicle_service.get_road_corridors()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch road corridors: {str(e)}")

@router.get("/counts")
def get_vehicle_counts():
    try:
        return vehicle_service.get_corridor_counts()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch vehicle counts: {str(e)}")

@router.post("/route-exposure", response_model=RouteExposureResponse)
def post_route_exposure(req: RouteExposureRequest = Body(...)):
    try:
        return vehicle_service.calculate_route_exposure(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Route exposure calculation failed: {str(e)}")
