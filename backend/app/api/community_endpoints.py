from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, Path as FPath, Body

from app.services.community_service import community_service
from app.schemas.advanced_schemas import (
    CommunityReportCreate,
    CommunityReportResponse,
    ReportCluster
)

router = APIRouter(prefix="/api/community", tags=["Citizen Air Quality Reporting"])

@router.post("/reports", response_model=CommunityReportResponse)
def post_community_report(report: CommunityReportCreate = Body(...)):
    try:
        return community_service.submit_report(report)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit community report: {str(e)}")

@router.get("/reports", response_model=List[CommunityReportResponse])
def get_community_reports(
    neighbourhood_id: Optional[str] = Query(None, description="Station/neighbourhood ID"),
    status: Optional[str] = Query(None, description="verified, pending, or flagged")
):
    try:
        return community_service.get_reports(neighbourhood_id=neighbourhood_id, status=status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reports: {str(e)}")

@router.get("/clusters", response_model=List[ReportCluster])
def get_community_clusters():
    try:
        return community_service.get_clusters()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate clusters: {str(e)}")

@router.post("/reports/{report_id}/upvote")
def post_upvote_report(report_id: str = FPath(...)):
    success = community_service.upvote_report(report_id)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"status": "upvoted", "report_id": report_id}
