from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Body

from app.services.decision_service import decision_service
from app.schemas.advanced_schemas import (
    ActionPlanRequest,
    ActionPlanResponse
)

router = APIRouter(prefix="/api/decision-support", tags=["Bloom's Taxonomy Decision Support"])

@router.get("/framework")
def get_blooms_framework():
    try:
        return decision_service.get_blooms_framework()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load framework: {str(e)}")

@router.post("/action-plan", response_model=ActionPlanResponse)
def post_action_plan(req: ActionPlanRequest = Body(...)):
    try:
        return decision_service.generate_action_plan(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate action plan: {str(e)}")
