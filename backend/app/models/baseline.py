import numpy as np
from typing import Dict, Any, Optional

class PersistenceBaseline:
    """
    Persistence baseline forecasting:
    predicted_concentration(t+h) = latest_valid_concentration(t)
    """
    def __init__(self):
        self.name = "PersistenceBaseline"

    def predict(self, latest_concentration: float) -> float:
        return float(latest_concentration)

class HistoricalProgressionBaseline:
    """
    Historical relative-day progression baseline:
    predicts the historical median concentration for (relative_day, hour).
    """
    def __init__(self, historical_profiles: Optional[Dict[int, float]] = None):
        self.name = "HistoricalProgressionBaseline"
        self.profiles = historical_profiles or {}

    def fit(self, relative_days: np.ndarray, concentrations: np.ndarray):
        # Build lookup table of median concentration by relative day
        data = {}
        for r_day, c in zip(relative_days, concentrations):
            data.setdefault(int(r_day), []).append(c)
        self.profiles = {r_day: float(np.median(vals)) for r_day, vals in data.items()}

    def predict(self, relative_day: int, fallback_val: float) -> float:
        return self.profiles.get(int(relative_day), float(fallback_val))
