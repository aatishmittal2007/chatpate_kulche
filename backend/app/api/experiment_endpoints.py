from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query, HTTPException
from app.services.experiment_service import experiment_service

router = APIRouter(prefix="/api/experiment", tags=["Trained Dataset & Experiment Results"])

@router.get("/summary")
def get_experiment_summary() -> Dict[str, Any]:
    """Returns the official run_summary.json metadata and caveats."""
    return experiment_service.get_summary()

@router.get("/metrics")
def get_metrics() -> Dict[str, Any]:
    """Returns both test evaluation metrics (2019) and validation metrics (2018)."""
    return {
        "test_metrics_2019": experiment_service.get_model_metrics(),
        "validation_metrics_2018": experiment_service.get_validation_metrics(),
        "source": "model_metrics.csv & validation_metrics.csv (diwali_air_quality_analysis)",
        "evaluation_windows": ["All_2019", "Diwali_7d", "Diwali_3d"]
    }

@router.get("/ensemble-weights")
def get_ensemble_weights() -> List[Dict[str, Any]]:
    """Returns validation-derived ensemble weights (RF 0.0, XGB 0.05, LGBM 0.45, Res-XGB 0.50)."""
    return experiment_service.get_ensemble_weights()

@router.get("/feature-importance")
def get_feature_importance(model: Optional[str] = Query(None, description="e.g. LightGBM, XGBoost, RandomForest")) -> List[Dict[str, Any]]:
    """Returns feature importance rankings from feature_importance.csv."""
    return experiment_service.get_feature_importance(model=model)

@router.get("/stations")
def get_experiment_stations() -> List[Dict[str, Any]]:
    """Returns the 15 selected monitoring stations with verified CPCB metadata and test observation counts."""
    return experiment_service.get_stations()

@router.get("/predictions-sample")
def get_predictions_sample(
    station_id: Optional[str] = Query(None, description="Station ID like DL002, DL019, HR014"),
    window: str = Query("all", description="'all', 'diwali_3d', or 'diwali_7d'"),
    limit: int = Query(500, ge=1, le=2000),
    offset: int = Query(0, ge=0)
) -> Dict[str, Any]:
    """Returns paginated actual vs next-hour predicted PM2.5 records from test_predictions_sample_100k.csv."""
    return experiment_service.get_predictions_sample(
        station_id=station_id,
        window=window,
        limit=limit,
        offset=offset
    )

@router.get("/diwali-timeseries")
def get_diwali_timeseries(
    station_id: str = Query("DL002", description="Station code (e.g., DL002 for Anand Vihar)")
) -> Dict[str, Any]:
    """Returns chronological hourly actual vs predicted timeseries across the 2019 Diwali window."""
    return experiment_service.get_diwali_timeseries(station_id=station_id)
