import math
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from app.core.database import get_connection
from app.spatial.calculations import haversine_distance as calculate_haversine_distance
from app.schemas.advanced_schemas import (
    CommunityReportCreate,
    CommunityReportResponse,
    ReportCluster
)

class CommunityService:
    def __init__(self):
        pass

    def submit_report(self, req: CommunityReportCreate) -> CommunityReportResponse:
        conn = get_connection()
        try:
            cur = conn.cursor()
            report_id = f"REP_{uuid.uuid4().hex[:8].upper()}"
            now_iso = datetime.now(timezone.utc).isoformat()

            # 1. Identify nearest official station
            cur.execute("SELECT id, name, latitude, longitude FROM stations WHERE is_active = 1")
            stations = cur.fetchall()

            nearest_stn_id = None
            min_dist_km = 9999.0
            for s in stations:
                d = calculate_haversine_distance(req.latitude, req.longitude, s[2], s[3])
                if d < min_dist_km:
                    min_dist_km = d
                    nearest_stn_id = s[0]

            # 2. Compute reliability score
            reliability = 50.0

            # Distance penalty: -4 points per km, capped at -25
            dist_penalty = min(25.0, min_dist_km * 4.0)
            reliability -= dist_penalty

            # Station consistency check
            cur.execute("""
            SELECT value FROM observations
            WHERE location_id = ? AND pollutant = 'PM2.5'
            ORDER BY timestamp DESC LIMIT 1
            """, (nearest_stn_id,))
            obs_row = cur.fetchone()
            latest_pm25 = obs_row[0] if obs_row else 250.0

            if req.visibility_level in ["< 50m", "< 100m"] and latest_pm25 >= 250.0:
                reliability += 20.0
            elif req.visibility_level in ["< 50m", "< 100m"] and latest_pm25 < 60.0:
                reliability -= 20.0 # Disparity penalty

            if req.cracker_activity == "Continuous heavy bursts" and latest_pm25 >= 200.0:
                reliability += 15.0

            if "Heavy" in req.smell_intensity or "Strong" in req.smell_intensity:
                reliability += 10.0

            # Spatial cluster bonus: check nearby reports in DB
            cur.execute("SELECT latitude, longitude FROM community_reports")
            other_reports = cur.fetchall()
            nearby_count = sum(1 for r in other_reports if calculate_haversine_distance(req.latitude, req.longitude, r[0], r[1]) <= 1.5)

            if nearby_count >= 3:
                reliability += 25.0
            elif nearby_count >= 1:
                reliability += 12.0

            # Bound score between 5.0 and 98.0
            reliability = round(max(5.0, min(98.0, reliability)), 1)
            status = "verified" if reliability >= 70.0 else ("pending" if reliability >= 40.0 else "flagged")

            # Reporter hash
            rep_hash = f"hash_{abs(hash(req.reporter_id or 'anon')) % 100000}"

            cur.execute("""
            INSERT INTO community_reports (
                id, timestamp, latitude, longitude, neighbourhood_id, category,
                description, visibility_level, smell_intensity, cracker_activity,
                status, reliability_score, upvotes, reporter_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
            """, (
                report_id, now_iso, req.latitude, req.longitude,
                req.neighbourhood_id or nearest_stn_id, req.category,
                req.description, req.visibility_level, req.smell_intensity,
                req.cracker_activity, status, reliability, rep_hash
            ))
            conn.commit()

            return CommunityReportResponse(
                id=report_id,
                timestamp=now_iso,
                latitude=req.latitude,
                longitude=req.longitude,
                neighbourhood_id=req.neighbourhood_id or nearest_stn_id,
                category=req.category,
                description=req.description,
                visibility_level=req.visibility_level,
                smell_intensity=req.smell_intensity,
                cracker_activity=req.cracker_activity,
                status=status,
                reliability_score=reliability,
                upvotes=0
            )
        finally:
            conn.close()

    def get_reports(self, neighbourhood_id: Optional[str] = None, status: Optional[str] = None) -> List[CommunityReportResponse]:
        conn = get_connection()
        try:
            cur = conn.cursor()
            clauses = []
            params = []
            if neighbourhood_id:
                clauses.append("neighbourhood_id = ?")
                params.append(neighbourhood_id)
            if status:
                clauses.append("status = ?")
                params.append(status)

            where_str = f"WHERE {' AND '.join(clauses)}" if clauses else ""
            cur.execute(f"""
            SELECT id, timestamp, latitude, longitude, neighbourhood_id, category,
                   description, visibility_level, smell_intensity, cracker_activity,
                   status, reliability_score, upvotes
            FROM community_reports
            {where_str}
            ORDER BY timestamp DESC
            """, tuple(params))
            rows = [dict(r) for r in cur.fetchall()]
            return [CommunityReportResponse(**r) for r in rows]
        finally:
            conn.close()

    def get_clusters(self) -> List[ReportCluster]:
        reports = self.get_reports(status="verified")
        if not reports:
            reports = self.get_reports()

        clusters: List[ReportCluster] = []
        assigned = set()

        for i, r in enumerate(reports):
            if r.id in assigned:
                continue

            current_group = [r]
            assigned.add(r.id)

            for j, other in enumerate(reports):
                if other.id not in assigned:
                    dist = calculate_haversine_distance(r.latitude, r.longitude, other.latitude, other.longitude)
                    if dist <= 2.0:
                        current_group.append(other)
                        assigned.add(other.id)

            center_lat = sum(x.latitude for x in current_group) / len(current_group)
            center_lon = sum(x.longitude for x in current_group) / len(current_group)
            avg_rel = sum(x.reliability_score for x in current_group) / len(current_group)
            dom_cat = max(set(x.category for x in current_group), key=lambda c: sum(1 for x in current_group if x.category == c))

            clusters.append(ReportCluster(
                cluster_id=f"cluster_{i+1}",
                center_lat=round(center_lat, 4),
                center_lon=round(center_lon, 4),
                report_count=len(current_group),
                dominant_category=dom_cat,
                avg_reliability=round(avg_rel, 1),
                neighbourhood_id=current_group[0].neighbourhood_id,
                reports=current_group
            ))

        return clusters

    def upvote_report(self, report_id: str) -> bool:
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute("UPDATE community_reports SET upvotes = upvotes + 1 WHERE id = ?", (report_id,))
            conn.commit()
            return cur.rowcount > 0
        finally:
            conn.close()

community_service = CommunityService()
