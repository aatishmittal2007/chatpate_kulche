from fastapi import APIRouter, HTTPException
from app.services.qwen_service import qwen_service
from app.schemas.advanced_schemas import (
    QwenChatRequest,
    QwenChatResponse,
    PredictionExplanationRequest,
    PredictionExplanationResponse,
    EventAnalysisRequest,
    EventAnalysisResponse,
    NaturalSearchRequest,
    NaturalSearchResponse
)

router = APIRouter(prefix="/api/ai", tags=["AI & Qwen 3.8 Intelligence"])

@router.post("/chat", response_model=QwenChatResponse)
async def post_ai_chat(req: QwenChatRequest):
    try:
        return await qwen_service.chat(
            messages=req.messages,
            location_id=req.location_id,
            use_reasoning_model=req.use_reasoning_model
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat error: {str(e)}")

@router.post("/explain-prediction", response_model=PredictionExplanationResponse)
def post_explain_prediction(req: PredictionExplanationRequest):
    try:
        return qwen_service.explain_prediction(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction explanation failed: {str(e)}")

@router.post("/analyze-event", response_model=EventAnalysisResponse)
def post_analyze_event(req: EventAnalysisRequest):
    try:
        return qwen_service.analyze_event(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Event analysis failed: {str(e)}")

@router.post("/natural-search", response_model=NaturalSearchResponse)
def post_natural_search(req: NaturalSearchRequest):
    try:
        return qwen_service.natural_search(req.query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Natural search interpretation failed: {str(e)}")

@router.get("/health")
def get_qwen_health():
    return qwen_service.check_health()
