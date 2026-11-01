from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from app.core.database import get_connection
from app.schemas.advanced_schemas import (
    ActionPlanRequest,
    ActionPlanResponse
)

class DecisionService:
    def __init__(self):
        pass

    def get_blooms_framework(self) -> Dict[str, Any]:
        return {
            "title": "Bloom's Taxonomy Framework for Diwali Environmental Decision Support",
            "levels": [
                {
                    "level": "Remember",
                    "badge": "Level 1: Factual Recall",
                    "description": "Fundamental air quality benchmarks, pollutant properties, and chemical compounds.",
                    "topics": [
                        {
                            "title": "CPCB Air Quality Index (AQI) Scales",
                            "content": "Good (0-50), Satisfactory (51-100), Moderate (101-200), Poor (201-300), Very Poor (301-400), Severe (401-500), Severe+ Hazardous (>500)."
                        },
                        {
                            "title": "Particulate Standards (24-Hour)",
                            "content": "CPCB NAAQS: PM2.5 is 60 µg/m³, PM10 is 100 µg/m³. WHO Guideline: PM2.5 is 15 µg/m³, PM10 is 45 µg/m³. Diwali episodes often surpass CPCB norms by 8x-12x."
                        },
                        {
                            "title": "Pyrotechnic Chemical Constituents",
                            "content": "Barium Nitrate (green light, toxic to myocardium), Strontium Nitrate (red glow), Potassium Perchlorate (oxidizer), Sulfur (acidic SO2 emissions), Copper compounds (heavy metal aerosol)."
                        }
                    ]
                },
                {
                    "level": "Understand",
                    "badge": "Level 2: Conceptual Physics",
                    "description": "Meteorological physics and atmospheric mechanics governing festival pollution stagnation.",
                    "topics": [
                        {
                            "title": "Planetary Boundary Layer (PBL) Collapse",
                            "content": "During daytime, solar heating expands the boundary layer up to 1,200 m. After sunset, radiational cooling rapidly compresses the layer below 350 m, reducing the volume of air available to dilute emissions by 75%."
                        },
                        {
                            "title": "Ground Thermal Inversion Cap",
                            "content": "Warm air aloft prevents cold, dense surface air from rising. Particulate matter from vehicles and fireworks remains trapped near the ground, creating an airtight smog chamber."
                        },
                        {
                            "title": "Hygroscopic Aerosol Growth (Magnus RH)",
                            "content": "When relative humidity exceeds 70%, hygroscopic salts (sulfates, nitrates) absorb moisture, swelling particle optical size, drastically dropping visibility below 100m."
                        }
                    ]
                },
                {
                    "level": "Apply",
                    "badge": "Level 3: Protective Implementation",
                    "description": "Translating scientific forecasts into immediate personal, household, and community protection.",
                    "topics": [
                        {
                            "title": "Respiratory Protection Protocols",
                            "content": "Use certified N95 or FFP2 respirators with an airtight nasal pinch. Cloth or surgical masks do not filter sub-micron PM2.5 combustion aerosols."
                        },
                        {
                            "title": "Indoor Air Purifier Sizing",
                            "content": "Require Clean Air Delivery Rate (CADR) of at least 5 Air Changes per Hour (ACH). Formula: CADR (m³/h) = Room Area (m²) × Ceiling Height (m) × 5."
                        },
                        {
                            "title": "Exercise & Exposure Windows",
                            "content": "Completely suspend outdoor cardio, jogging, and school sports when AQI > 300. Restrict outdoor tasks to midday (12:00-15:00) when inversion lifts slightly."
                        }
                    ]
                },
                {
                    "level": "Analyze",
                    "badge": "Level 4: Causal Apportionment",
                    "description": "Decomposing festival smog episodes into individual source contributions.",
                    "topics": [
                        {
                            "title": "Diwali Night Source Breakdown",
                            "content": "Pyrotechnics / Firecracker Surge: 38.6%, Upwind Stubble Burning: 29.4%, Vehicular Exhaust: 19.2%, Road Dust: 8.5%, Background/Secondary: 4.3%."
                        },
                        {
                            "title": "Lagged Transport Corridors",
                            "content": "Agricultural smoke plumes from Punjab & Haryana take 18 to 36 hours to travel across the 250 km northwest corridor under 2-3 m/s northwesterly winds."
                        }
                    ]
                },
                {
                    "level": "Evaluate",
                    "badge": "Level 5: Critical Policy Assessment",
                    "description": "Scientific scorecard analyzing the efficacy, feasibility, and costs of air quality mitigation policies.",
                    "policies": [
                        {
                            "policy": "Complete Firecracker Bans",
                            "effectiveness_score": 8.5,
                            "cost": "Low",
                            "feasibility": "Moderate",
                            "scientific_verdict": "Crucial for preventing the acute 8-hour toxic peak pulse, but requires strict inter-state border enforcement to prevent black-market inflow."
                        },
                        {
                            "policy": "Odd-Even Vehicle Rationing",
                            "effectiveness_score": 6.0,
                            "cost": "Low",
                            "feasibility": "High",
                            "scientific_verdict": "Reduces daytime road congestion and localized NOx by 12-15%, but has limited impact on nocturnal PM2.5 firecracker or stubble plumes."
                        },
                        {
                            "policy": "Anti-Smog Guns / Water Cannons",
                            "effectiveness_score": 3.5,
                            "cost": "Moderate",
                            "feasibility": "High",
                            "scientific_verdict": "Settles coarse construction dust (PM10) within a 50m radius for 20 minutes; zero impact on sub-micron combustion particles (PM2.5)."
                        },
                        {
                            "policy": "Giant Outdoor Smog Towers",
                            "effectiveness_score": 2.0,
                            "cost": "Very High",
                            "feasibility": "Low",
                            "scientific_verdict": "Thermodynamically futile outdoors in open atmosphere; filters negligible fraction of ambient air mass beyond 100 meters."
                        },
                        {
                            "policy": "Mechanical Sweepers & Vacuuming",
                            "effectiveness_score": 7.5,
                            "cost": "Moderate",
                            "feasibility": "High",
                            "scientific_verdict": "Highly effective at removing silt from arterial corridors before vehicular turbulence can re-suspend it into respirable air."
                        }
                    ]
                },
                {
                    "level": "Create",
                    "badge": "Level 6: Citizen & Ward Action Plans",
                    "description": "Generating personalized protection regimens and ward-level policy intervention briefs."
                }
            ]
        }

    def generate_action_plan(self, req: ActionPlanRequest) -> ActionPlanResponse:
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT name FROM stations WHERE id = ?", (req.neighbourhood_id,))
            row = cur.fetchone()
            stn_name = row[0] if row else req.neighbourhood_id

            # Latest PM2.5
            cur.execute("""
            SELECT value FROM observations
            WHERE location_id = ? AND pollutant = 'PM2.5'
            ORDER BY timestamp DESC LIMIT 1
            """, (req.neighbourhood_id,))
            obs_row = cur.fetchone()
            curr_val = obs_row[0] if obs_row else 320.0

            # Predicted peak
            cur.execute("""
            SELECT MAX(point_forecast) FROM forecast_cache
            WHERE location_id = ? AND pollutant = 'PM2.5'
            """, (req.neighbourhood_id,))
            f_row = cur.fetchone()
            peak_val = f_row[0] if f_row and f_row[0] else 450.0

            curr_aqi = min(500, int(curr_val * 1.15))
            peak_aqi = min(500, int(peak_val * 1.15))

            vuln = req.vulnerability_group.lower()
            if "child" in vuln:
                immediate = [
                    "Keep children strictly indoors with all windows and balcony doors sealed.",
                    "Ensure indoor air purifier runs continuously on sleep/medium mode in bedrooms.",
                    "Do not burn incense sticks, mosquito coils, or candles indoors."
                ]
                indoor = [
                    "Maintain indoor PM2.5 below 20 µg/m³ using True HEPA H13 filtration.",
                    "Use damp microfiber cloths for surface dusting instead of dry sweeping."
                ]
                outdoor = [
                    "Suspend outdoor sports, playground visits, and school morning assemblies.",
                    "If essential travel is required, ensure a snug-fitting child-sized N95 mask."
                ]
                cad_rec = "Requires HEPA unit with minimum 250 m³/h CADR per 200 sq ft room."
                mask_rec = "Child-sized certified N95 / KF94 respirator with adjustable strap."
            elif "elderly" in vuln or "asthma" in vuln:
                immediate = [
                    "Stock minimum 14-day supply of prescribed inhalers and bronchodilators.",
                    "Monitor peak expiratory flow (PEF) twice daily; consult doctor on PEF drop > 15%.",
                    "Avoid early morning exposure between 06:00 and 09:30 when inversion is lowest."
                ]
                indoor = [
                    "Run HEPA air purifier continuously with air quality indicator monitoring.",
                    "Keep hydration high to maintain mucous membrane defense in throat and nasal passage."
                ]
                outdoor = [
                    "Zero outdoor exercise or walking during Diwali eve and post-Diwali morning.",
                    "Wear an airtight N95 respirator for any clinic or outdoor transit."
                ]
                cad_rec = "High-capacity HEPA unit with minimum 350 m³/h CADR and activated carbon stage."
                mask_rec = "FFP2 or N95 mask with silicone face seal for maximum filtration efficiency."
            else:
                immediate = [
                    "Avoid high-intensity outdoor running, cycling, or jogging after 18:00.",
                    "Seal room perimeter with weather-stripping tape if drafts are detected.",
                    "Switch car ventilation to 'Internal Recirculation' mode during transit."
                ]
                indoor = [
                    "Operate HEPA filtration in primary living areas.",
                    "Limit kitchen exhaust leakage into living spaces by closing kitchen doors."
                ]
                outdoor = [
                    "Wear an N95 respirator if commuting on two-wheelers or open auto-rickshaws.",
                    "Plan travel along lower-emission bypass corridors (e.g. Barapullah) rather than arterial chokepoints."
                ]
                cad_rec = "Standard HEPA unit with minimum 200 m³/h CADR per room."
                mask_rec = "Standard certified N95 respirator with metal nose clip."

            ward_policy = (
                f"Ward Action for {stn_name}: Deploy mechanical sweeping teams along arterial corridors from 22:00 to 04:00; "
                "enforce zero open burning at construction perimeters; establish designated senior-citizen clean air breathing shelters."
            )

            return ActionPlanResponse(
                neighbourhood_name=stn_name,
                current_aqi=curr_aqi,
                predicted_peak_aqi=peak_aqi,
                vulnerability_group=req.vulnerability_group,
                immediate_actions=immediate,
                indoor_guidance=indoor,
                outdoor_restrictions=outdoor,
                purifier_sizing_recommendation=cad_rec,
                mask_specification=mask_rec,
                ward_level_policy_recommendation=ward_policy
            )
        finally:
            conn.close()

decision_service = DecisionService()
