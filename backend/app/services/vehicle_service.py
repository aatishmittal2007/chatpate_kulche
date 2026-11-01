import math
import random
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from app.core.database import get_connection
from app.schemas.advanced_schemas import (
    VehicleClassCounts,
    VehicleDetectResponse,
    RoadCorridorSchema,
    RouteExposureRequest,
    RouteExposureResponse,
    RouteAlternative
)

# Standardized Vehicle Emission Factors (COPERT / CPCB India Norms) in grams / km
EMISSION_FACTORS = {
    "trucks": {"pm25": 0.45, "nox": 4.20},
    "buses": {"pm25": 0.38, "nox": 3.80},
    "three_wheelers": {"pm25": 0.15, "nox": 0.40},
    "cars": {"pm25": 0.08, "nox": 0.60},
    "motorcycles": {"pm25": 0.05, "nox": 0.30}
}

class VehicleService:
    def __init__(self):
        pass

    def detect_vehicles_in_sample(self, duration_sec: int = 30) -> VehicleDetectResponse:
        """
        Simulates computer vision frame-by-frame object detection and tracking 
        across an arterial traffic stream (e.g. Vikas Marg / Ring Road).
        """
        # Realistic representative distribution for Delhi arterial road during festival evening
        cars = int(random.uniform(45, 65) * (duration_sec / 10))
        two_wheelers = int(random.uniform(50, 80) * (duration_sec / 10))
        auto_rickshaws = int(random.uniform(25, 40) * (duration_sec / 10))
        buses = int(random.uniform(4, 9) * (duration_sec / 10))
        trucks = int(random.uniform(2, 6) * (duration_sec / 10))
        total = cars + two_wheelers + auto_rickshaws + buses + trucks

        avg_speed = round(random.uniform(18.0, 26.5), 1) # km/h under congestion
        congestion_index = round(max(0.0, min(1.0, 1.0 - (avg_speed / 50.0))), 2)

        # Calculate hourly emissions for this road stream in kg/hour
        # Total vehicles scaled to 1 hour
        scaling_to_hour = 3600.0 / duration_sec
        hourly_cars = cars * scaling_to_hour
        hourly_2w = two_wheelers * scaling_to_hour
        hourly_3w = auto_rickshaws * scaling_to_hour
        hourly_buses = buses * scaling_to_hour
        hourly_trucks = trucks * scaling_to_hour

        pm25_kg = (
            hourly_cars * EMISSION_FACTORS["cars"]["pm25"] +
            hourly_2w * EMISSION_FACTORS["motorcycles"]["pm25"] +
            hourly_3w * EMISSION_FACTORS["three_wheelers"]["pm25"] +
            hourly_buses * EMISSION_FACTORS["buses"]["pm25"] +
            hourly_trucks * EMISSION_FACTORS["trucks"]["pm25"]
        ) / 1000.0 # g to kg

        nox_kg = (
            hourly_cars * EMISSION_FACTORS["cars"]["nox"] +
            hourly_2w * EMISSION_FACTORS["motorcycles"]["nox"] +
            hourly_3w * EMISSION_FACTORS["three_wheelers"]["nox"] +
            hourly_buses * EMISSION_FACTORS["buses"]["nox"] +
            hourly_trucks * EMISSION_FACTORS["trucks"]["nox"]
        ) / 1000.0

        congestion_status = "Severe Congestion" if congestion_index > 0.65 else ("Moderate Congestion" if congestion_index > 0.4 else "Free Flow")

        return VehicleDetectResponse(
            processed_frames=int(duration_sec * 30), # 30 fps
            total_vehicles_detected=total,
            class_breakdown=VehicleClassCounts(
                cars=cars,
                buses=buses,
                trucks=trucks,
                motorcycles=two_wheelers,
                three_wheelers=auto_rickshaws,
                total=total
            ),
            average_speed_kmh=avg_speed,
            congestion_status=congestion_status,
            estimated_hourly_pm25_kg=round(pm25_kg, 2),
            estimated_hourly_nox_kg=round(nox_kg, 2)
        )

    def get_road_corridors(self) -> List[RoadCorridorSchema]:
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
            SELECT id, name, from_point, to_point, length_km, baseline_speed_kmh,
                   current_speed_kmh, vehicle_density_per_km, congestion_index,
                   estimated_pm25_kgh, lat_start, lon_start, lat_end, lon_end
            FROM road_corridors
            ORDER BY congestion_index DESC
            """)
            rows = [dict(r) for r in cur.fetchall()]
            return [RoadCorridorSchema(**r) for r in rows]
        finally:
            conn.close()

    def get_corridor_counts(self) -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
            SELECT v.corridor_id, c.name, v.cars, v.buses, v.trucks, v.motorcycles,
                   v.three_wheelers, v.average_speed_kmh, v.timestamp
            FROM vehicle_detections v
            JOIN road_corridors c ON v.corridor_id = c.id
            ORDER BY v.timestamp DESC
            """)
            return [dict(r) for r in cur.fetchall()]
        finally:
            conn.close()

    def calculate_route_exposure(self, req: RouteExposureRequest) -> RouteExposureResponse:
        """
        Calculates personal inhalation exposure comparing a standard fast corridor vs. 
        a cleaner, lower-emission alternative route avoiding severe pollution hotspots.
        """
        origin = req.origin or "Connaught Place, Central Delhi"
        destination = req.destination or "Anand Vihar ISBT, East Delhi"

        # Standard Arterial Route (via Vikas Marg & ITO - high congestion, high ground pollution)
        std_dist_km = 14.8
        std_avg_speed = 22.0 # km/h
        std_time_min = round((std_dist_km / std_avg_speed) * 60, 1) # ~40.4 min
        std_avg_pm25 = 390.0 # µg/m³ along heavy arterial corridor
        # Exposure Index = (Avg Concentration µg/m³) * (Time in hours)
        std_exposure = round(std_avg_pm25 * (std_time_min / 60.0), 1)

        # Clean Alternative Route (via Barapullah / Ring Road bypass with green buffer)
        clean_dist_km = 17.2 # slightly longer distance
        clean_avg_speed = 36.0 # better speed
        clean_time_min = round((clean_dist_km / clean_avg_speed) * 60, 1) # ~28.7 min
        clean_avg_pm25 = 225.0 # µg/m³ significantly lower particulate exposure
        clean_exposure = round(clean_avg_pm25 * (clean_time_min / 60.0), 1)

        diff_pct = round(((std_exposure - clean_exposure) / std_exposure) * 100.0, 1)

        std_route = RouteAlternative(
            route_name="Fastest Arterial (via Vikas Marg / ITO)",
            route_type="fastest_standard",
            distance_km=std_dist_km,
            travel_time_min=std_time_min,
            avg_pm25_ugm3=std_avg_pm25,
            cumulative_exposure_index=std_exposure,
            corridors_traversed=["Vikas Marg (East Delhi)", "ITO Junction", "Anand Vihar Highway"],
            exposure_difference_pct=0.0,
            advisory="High traffic density and stagnant vehicle exhaust elevate inhaled particulate burden."
        )

        clean_route = RouteAlternative(
            route_name="Clean Air Green Corridor (via Barapullah Bypass)",
            route_type="clean_alternative",
            distance_km=clean_dist_km,
            travel_time_min=clean_time_min,
            avg_pm25_ugm3=clean_avg_pm25,
            cumulative_exposure_index=clean_exposure,
            corridors_traversed=["Barapullah Elevated", "DND Flyway Corridor", "Noida Link Road"],
            exposure_difference_pct=-diff_pct,
            advisory=f"Reduces inhaled PM2.5 particulate mass by {diff_pct}% while maintaining comparable transit time."
        )

        return RouteExposureResponse(
            origin=origin,
            destination=destination,
            standard_route=std_route,
            clean_route=clean_route,
            recommended_route=clean_route.route_name,
            potential_exposure_reduction_pct=diff_pct,
            health_guidance=(
                f"Taking the {clean_route.route_name} prevents approximately {diff_pct}% of cumulative lung aerosol deposition. "
                "Keep cabin windows sealed with AC set to internal recirculation mode."
            )
        )

vehicle_service = VehicleService()
