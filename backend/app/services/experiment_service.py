import os
import json
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from pathlib import Path

# Path to project root (diwali-airsense)
PROJECT_ROOT = Path(__file__).resolve().parents[3]
EXP_DATA_DIR = os.path.join(PROJECT_ROOT, "data", "experiment", "diwali_air_quality_analysis")

# Verified CAAQMS Metadata for the 15 experimental stations
VERIFIED_STATION_METADATA = {
    "DL002": {
        "id": "DL002",
        "name": "Anand Vihar, Delhi",
        "city": "Delhi",
        "state": "Delhi",
        "region": "Northern India / NCR",
        "latitude": 28.6469,
        "longitude": 77.3160,
        "is_active": True,
        "is_verified_cpcb": True,
        "type": "Traffic & Inter-state Transit Hub",
        "total_test_records_2019": 8408
    },
    "DL019": {
        "id": "DL019",
        "name": "Punjabi Bagh, Delhi",
        "city": "Delhi",
        "state": "Delhi",
        "region": "Northern India / NCR",
        "latitude": 28.6740,
        "longitude": 77.1310,
        "is_active": True,
        "is_verified_cpcb": True,
        "type": "Mixed Residential & Arterial Ring Road",
        "total_test_records_2019": 8473
    },
    "DL021": {
        "id": "DL021",
        "name": "R.K. Puram, Delhi",
        "city": "Delhi",
        "state": "Delhi",
        "region": "Northern India / NCR",
        "latitude": 28.5632,
        "longitude": 77.1869,
        "is_active": True,
        "is_verified_cpcb": True,
        "type": "Institutional & Residential Sector",
        "total_test_records_2019": 8700
    },
    "DL028": {
        "id": "DL028",
        "name": "Mandir Marg, Delhi",
        "city": "Delhi",
        "state": "Delhi",
        "region": "Northern India / NCR",
        "latitude": 28.6364,
        "longitude": 77.2010,
        "is_active": True,
        "is_verified_cpcb": True,
        "type": "Central Mixed & Cultural Zone",
        "total_test_records_2019": 8473
    },
    "DL031": {
        "id": "DL031",
        "name": "Siri Fort, Delhi",
        "city": "Delhi",
        "state": "Delhi",
        "region": "Northern India / NCR",
        "latitude": 28.5504,
        "longitude": 77.2159,
        "is_active": True,
        "is_verified_cpcb": True,
        "type": "Green Buffer & Sports Complex",
        "total_test_records_2019": 7155
    },
    "HR014": {
        "id": "HR014",
        "name": "Sector 51, Gurugram",
        "city": "Gurugram",
        "state": "Haryana",
        "region": "Northern India / NCR",
        "latitude": 28.4227,
        "longitude": 77.0667,
        "is_active": True,
        "is_verified_cpcb": True,
        "type": "Suburban Commercial / Residential",
        "total_test_records_2019": 8127
    },
    "UP012": {
        "id": "UP012",
        "name": "Talkatora Industrial Area, Lucknow",
        "city": "Lucknow",
        "state": "Uttar Pradesh",
        "region": "Northern India / Gangetic Plain",
        "latitude": 26.8339,
        "longitude": 80.8996,
        "is_active": True,
        "is_verified_cpcb": True,
        "type": "Industrial & Heavy Goods Hub",
        "total_test_records_2019": 0  # In validation/test split subsets
    },
    "UP014": {
        "id": "UP014",
        "name": "Lalbagh, Lucknow",
        "city": "Lucknow",
        "state": "Uttar Pradesh",
        "region": "Northern India / Gangetic Plain",
        "latitude": 26.8533,
        "longitude": 80.9405,
        "is_active": True,
        "is_verified_cpcb": True,
        "type": "Commercial & Civic District",
        "total_test_records_2019": 0
    },
    "GJ001": {
        "id": "GJ001",
        "name": "Maninagar, Ahmedabad",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "region": "Western India",
        "latitude": 22.9984,
        "longitude": 72.6035,
        "is_active": True,
        "is_verified_cpcb": True,
        "type": "Urban Mixed Residential",
        "total_test_records_2019": 8148
    },
    "KA003": {
        "id": "KA003",
        "name": "BTM Layout, Bengaluru",
        "city": "Bengaluru",
        "state": "Karnataka",
        "region": "Southern India",
        "latitude": 12.9135,
        "longitude": 77.5959,
        "is_active": True,
        "is_verified_cpcb": True,
        "type": "Tech Corridor & Residential",
        "total_test_records_2019": 7334
    },
    "KA009": {
        "id": "KA009",
        "name": "Peenya, Bengaluru",
        "city": "Bengaluru",
        "state": "Karnataka",
        "region": "Southern India",
        "latitude": 13.0285,
        "longitude": 77.5197,
        "is_active": True,
        "is_verified_cpcb": True,
        "type": "Major Industrial Estate",
        "total_test_records_2019": 7847
    },
    "TG005": {
        "id": "TG005",
        "name": "Sanathnagar, Hyderabad",
        "city": "Hyderabad",
        "state": "Telangana",
        "region": "Southern India",
        "latitude": 17.4589,
        "longitude": 78.4428,
        "is_active": True,
        "is_verified_cpcb": True,
        "type": "Industrial & Urban Hub",
        "total_test_records_2019": 7742
    },
    "TN001": {
        "id": "TN001",
        "name": "Alandur, Chennai",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "region": "Southern India / Coastal",
        "latitude": 13.0012,
        "longitude": 80.2014,
        "is_active": True,
        "is_verified_cpcb": True,
        "type": "Urban Transit Interchange",
        "total_test_records_2019": 8017
    },
    "TN003": {
        "id": "TN003",
        "name": "Manali, Chennai",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "region": "Southern India / Coastal",
        "latitude": 13.1645,
        "longitude": 80.2628,
        "is_active": True,
        "is_verified_cpcb": True,
        "type": "Petrochemical & Port Industrial",
        "total_test_records_2019": 6914
    },
    "TN004": {
        "id": "TN004",
        "name": "Velachery, Chennai",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "region": "Southern India / Coastal",
        "latitude": 12.9757,
        "longitude": 80.2207,
        "is_active": True,
        "is_verified_cpcb": True,
        "type": "Mixed Residential & Commercial",
        "total_test_records_2019": 4662
    }
}

class ExperimentDataService:
    def __init__(self):
        self._summary = None
        self._metrics = None
        self._val_metrics = None
        self._weights = None
        self._importance = None
        self._predictions_df = None

    def get_summary(self) -> Dict[str, Any]:
        if self._summary is None:
            path = os.path.join(EXP_DATA_DIR, "run_summary.json")
            if os.path.exists(path):
                with open(path, "r") as f:
                    self._summary = json.load(f)
            else:
                self._summary = {"status": "not_found"}
        return self._summary

    def get_model_metrics(self) -> List[Dict[str, Any]]:
        if self._metrics is None:
            path = os.path.join(EXP_DATA_DIR, "model_metrics.csv")
            if os.path.exists(path):
                df = pd.read_csv(path)
                self._metrics = df.to_dict(orient="records")
            else:
                self._metrics = []
        return self._metrics

    def get_validation_metrics(self) -> List[Dict[str, Any]]:
        if self._val_metrics is None:
            path = os.path.join(EXP_DATA_DIR, "validation_metrics.csv")
            if os.path.exists(path):
                df = pd.read_csv(path)
                self._val_metrics = df.to_dict(orient="records")
            else:
                self._val_metrics = []
        return self._val_metrics

    def get_ensemble_weights(self) -> List[Dict[str, Any]]:
        if self._weights is None:
            path = os.path.join(EXP_DATA_DIR, "ensemble_weights.csv")
            if os.path.exists(path):
                df = pd.read_csv(path)
                self._weights = df.to_dict(orient="records")
            else:
                self._weights = []
        return self._weights

    def get_feature_importance(self, model: Optional[str] = None) -> List[Dict[str, Any]]:
        if self._importance is None:
            path = os.path.join(EXP_DATA_DIR, "feature_importance.csv")
            if os.path.exists(path):
                df = pd.read_csv(path)
                self._importance = df.to_dict(orient="records")
            else:
                self._importance = []
        if model:
            return [f for f in self._importance if f.get("Model", "").lower() == model.lower()]
        return self._importance

    def get_stations(self) -> List[Dict[str, Any]]:
        summary = self.get_summary()
        selected_ids = summary.get("selected_station_ids", list(VERIFIED_STATION_METADATA.keys()))
        result = []
        for sid in selected_ids:
            if sid in VERIFIED_STATION_METADATA:
                result.append(VERIFIED_STATION_METADATA[sid])
            else:
                result.append({
                    "id": sid,
                    "name": f"Station {sid}",
                    "city": "Unknown",
                    "state": "Unknown",
                    "latitude": None,
                    "longitude": None,
                    "is_active": True,
                    "is_verified_cpcb": False,
                    "total_test_records_2019": 0
                })
        return result

    def _load_predictions_df(self) -> pd.DataFrame:
        if self._predictions_df is None:
            path = os.path.join(EXP_DATA_DIR, "test_predictions_sample_100k.csv")
            if os.path.exists(path):
                self._predictions_df = pd.read_csv(path)
            else:
                self._predictions_df = pd.DataFrame()
        return self._predictions_df

    def get_predictions_sample(
        self,
        station_id: Optional[str] = None,
        window: str = "all",
        limit: int = 500,
        offset: int = 0
    ) -> Dict[str, Any]:
        df = self._load_predictions_df()
        if df.empty:
            return {"total_count": 0, "rows": [], "summary_stats": {}}

        filtered = df
        if station_id:
            filtered = filtered[filtered["StationId"] == station_id]
        if window == "diwali_3d":
            filtered = filtered[filtered["diwali_window_3d"] == 1]
        elif window == "diwali_7d":
            filtered = filtered[filtered["diwali_window_7d"] == 1]

        total_count = len(filtered)
        paged = filtered.iloc[offset: offset + limit]

        # Calculate actual vs predicted stats for this slice
        summary_stats = {}
        if not paged.empty and "target_next_hour" in paged.columns:
            actual = paged["target_next_hour"].dropna()
            summary_stats = {
                "count": len(paged),
                "actual_mean": round(float(actual.mean()), 2),
                "actual_min": round(float(actual.min()), 2),
                "actual_max": round(float(actual.max()), 2),
            }
            if "Residual_XGBoost_prediction" in paged.columns:
                res_pred = paged["Residual_XGBoost_prediction"].dropna()
                summary_stats["residual_xgb_mae"] = round(float(np.mean(np.abs(actual - res_pred))), 3)
                summary_stats["residual_xgb_rmse"] = round(float(np.sqrt(np.mean((actual - res_pred)**2))), 3)
            if "Weighted_Ensemble_prediction" in paged.columns:
                ens_pred = paged["Weighted_Ensemble_prediction"].dropna()
                summary_stats["ensemble_mae"] = round(float(np.mean(np.abs(actual - ens_pred))), 3)
                summary_stats["ensemble_rmse"] = round(float(np.sqrt(np.mean((actual - ens_pred)**2))), 3)
            if "Persistence_prediction" in paged.columns:
                pers_pred = paged["Persistence_prediction"].dropna()
                summary_stats["persistence_mae"] = round(float(np.mean(np.abs(actual - pers_pred))), 3)

        rows = paged.to_dict(orient="records")
        # Clean NaNs for JSON safety
        for r in rows:
            for k, v in r.items():
                if pd.isna(v):
                    r[k] = None

        return {
            "total_count": total_count,
            "limit": limit,
            "offset": offset,
            "station_id": station_id,
            "window": window,
            "summary_stats": summary_stats,
            "rows": rows
        }

    def get_diwali_timeseries(self, station_id: str = "DL002") -> Dict[str, Any]:
        """
        Returns chronological timeseries across the 2019 Diwali window (Diwali was Oct 27, 2019).
        Window spans Oct 20 to Nov 3 (Diwali ±7 days).
        """
        df = self._load_predictions_df()
        if df.empty:
            return {"station_id": station_id, "points": []}

        sub = df[(df["StationId"] == station_id) & (df["diwali_window_7d"] == 1)].copy()
        if sub.empty:
            # Fall back to any station with records in diwali_window_7d
            sub = df[df["diwali_window_7d"] == 1].copy()
            if not sub.empty:
                station_id = sub["StationId"].iloc[0]
                sub = sub[sub["StationId"] == station_id]

        sub = sub.sort_values("Datetime")
        points = []
        for _, r in sub.iterrows():
            points.append({
                "datetime": r["Datetime"],
                "observed_current": round(float(r["PM2.5"]), 2) if pd.notna(r["PM2.5"]) else None,
                "actual_next_hour": round(float(r["target_next_hour"]), 2) if pd.notna(r["target_next_hour"]) else None,
                "residual_xgboost": round(float(r["Residual_XGBoost_prediction"]), 2) if pd.notna(r["Residual_XGBoost_prediction"]) else None,
                "weighted_ensemble": round(float(r["Weighted_Ensemble_prediction"]), 2) if pd.notna(r["Weighted_Ensemble_prediction"]) else None,
                "persistence": round(float(r["Persistence_prediction"]), 2) if pd.notna(r["Persistence_prediction"]) else None,
                "is_diwali_day": "2019-10-27" in str(r["Datetime"]),
                "is_diwali_3d": bool(r.get("diwali_window_3d", 0))
            })

        meta = VERIFIED_STATION_METADATA.get(station_id, {"name": station_id, "city": "Unknown"})
        return {
            "station_id": station_id,
            "station_name": meta.get("name"),
            "city": meta.get("city"),
            "diwali_date_2019": "2019-10-27",
            "total_points": len(points),
            "points": points
        }

# Global singleton
experiment_service = ExperimentDataService()
