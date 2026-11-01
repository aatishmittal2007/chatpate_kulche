import os
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List
import numpy as np
import pandas as pd
import joblib
from xgboost import XGBRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error

from app.models.baseline import PersistenceBaseline, HistoricalProgressionBaseline
from app.features.feature_pipeline import FEATURE_GROUPS

MODELS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "models"

class HorizonModel:
    """
    Direct multi-step forecaster incorporating Hybrid Ensemble 
    (Direct XGBoost + Random Forest Regressor with residual stacking over baseline).
    """
    def __init__(self, pollutant: str, horizon_hours: int):
        self.pollutant = pollutant
        self.horizon_hours = horizon_hours
        self.xgb_model: Optional[XGBRegressor] = None
        self.rf_model: Optional[RandomForestRegressor] = None
        self.feature_names: List[str] = []
        self.use_residual: bool = True
        self.fallback_to_baseline: bool = False
        self.error_quantile_80: float = 15.0
        self.error_quantile_95: float = 30.0
        self.val_mae: float = 0.0
        self.val_rmse: float = 0.0
        self.baseline_mae: float = 0.0
        self.baseline_rmse: float = 0.0
        self.train_samples: int = 0
        self.test_samples: int = 0

    def fit(self, train_df: pd.DataFrame, test_df: pd.DataFrame, feature_names: List[str]) -> Dict[str, Any]:
        self.feature_names = feature_names
        self.train_samples = len(train_df)
        self.test_samples = len(test_df)

        X_train = train_df[feature_names].values
        y_train = train_df["target_concentration"].values
        base_train = train_df["baseline_persistence"].values

        X_test = test_df[feature_names].values
        y_test = test_df["target_concentration"].values
        base_test = test_df["baseline_persistence"].values

        # Baseline performance
        self.baseline_mae = float(mean_absolute_error(y_test, base_test))
        self.baseline_rmse = float(root_mean_squared_error(y_test, base_test))

        # Train residual model: target is (y - base)
        residual_train = y_train - base_train

        # 1. XGBoost Regressor
        self.xgb_model = XGBRegressor(
            n_estimators=35,
            max_depth=3,
            learning_rate=0.08,
            subsample=0.85,
            colsample_bytree=0.85,
            reg_lambda=2.0,
            random_state=42,
            n_jobs=1
        )
        self.xgb_model.fit(X_train, residual_train)

        # 2. Random Forest Regressor
        self.rf_model = RandomForestRegressor(
            n_estimators=30,
            max_depth=4,
            max_features=0.85,
            random_state=42,
            n_jobs=1
        )
        self.rf_model.fit(X_train, residual_train)

        # Evaluate Hybrid Ensemble on test set: 60% XGBoost + 40% Random Forest
        xgb_preds = self.xgb_model.predict(X_test)
        rf_preds = self.rf_model.predict(X_test)
        predicted_residuals = 0.60 * xgb_preds + 0.40 * rf_preds

        preds = base_test + predicted_residuals
        preds = np.maximum(0.0, preds)

        self.val_mae = float(mean_absolute_error(y_test, preds))
        self.val_rmse = float(root_mean_squared_error(y_test, preds))

        # Check if Hybrid Ensemble improves upon persistence baseline
        if self.val_mae > self.baseline_mae * 1.02:
            self.fallback_to_baseline = True

        # Calculate empirical error quantiles for calibrated uncertainty
        errors = np.abs(y_test - (base_test if self.fallback_to_baseline else preds))
        self.error_quantile_80 = float(np.percentile(errors, 80)) if len(errors) > 0 else 15.0
        self.error_quantile_95 = float(np.percentile(errors, 95)) if len(errors) > 0 else 30.0

        return {
            "pollutant": self.pollutant,
            "horizon_hours": self.horizon_hours,
            "val_mae": round(self.val_mae, 2),
            "val_rmse": round(self.val_rmse, 2),
            "baseline_mae": round(self.baseline_mae, 2),
            "baseline_rmse": round(self.baseline_rmse, 2),
            "fallback_to_baseline": self.fallback_to_baseline,
            "improvement_pct": round(((self.baseline_mae - self.val_mae) / max(self.baseline_mae, 1e-4)) * 100.0, 1),
            "error_quantile_80": round(self.error_quantile_80, 2),
            "error_quantile_95": round(self.error_quantile_95, 2),
            "train_samples": self.train_samples,
            "test_samples": self.test_samples,
        }

    def predict(self, feature_row: Dict[str, Any]) -> Tuple[float, float, float, float, float]:
        """
        Returns: (point_pred, lower_80, upper_80, lower_95, upper_95)
        """
        base_val = float(feature_row.get("latest_val", feature_row.get("baseline_persistence", 100.0)))

        if self.fallback_to_baseline or self.xgb_model is None:
            point_pred = base_val
        else:
            feat_vector = np.array([[float(feature_row.get(f, 0.0)) for f in self.feature_names]])
            xgb_res = float(self.xgb_model.predict(feat_vector)[0])
            if self.rf_model is not None:
                rf_res = float(self.rf_model.predict(feat_vector)[0])
                predicted_residual = 0.60 * xgb_res + 0.40 * rf_res
            else:
                predicted_residual = xgb_res
            point_pred = max(0.0, base_val + predicted_residual)

        lower_80 = max(0.0, round(point_pred - self.error_quantile_80, 1))
        upper_80 = round(point_pred + self.error_quantile_80, 1)
        lower_95 = max(0.0, round(point_pred - self.error_quantile_95, 1))
        upper_95 = round(point_pred + self.error_quantile_95, 1)

        return round(point_pred, 1), lower_80, upper_80, lower_95, upper_95

    def save(self, directory: Optional[Path] = None):
        target_dir = directory or MODELS_DIR
        target_dir.mkdir(parents=True, exist_ok=True)
        filepath = target_dir / f"model_{self.pollutant.lower().replace('.', '')}_{self.horizon_hours}h.joblib"
        joblib.dump(self, filepath)

    @classmethod
    def load(cls, pollutant: str, horizon_hours: int, directory: Optional[Path] = None) -> Optional["HorizonModel"]:
        target_dir = directory or MODELS_DIR
        filepath = target_dir / f"model_{pollutant.lower().replace('.', '')}_{horizon_hours}h.joblib"
        if filepath.exists():
            return joblib.load(filepath)
        return None

class RandomForestForecaster:
    """Standalone Random Forest Regressor for multi-model comparison benchmarks."""
    def __init__(self, n_estimators: int = 40, max_depth: int = 4):
        self.model = RandomForestRegressor(n_estimators=n_estimators, max_depth=max_depth, random_state=42, n_jobs=1)

    def fit(self, X: np.ndarray, y: np.ndarray):
        self.model.fit(X, y)

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X)

class HybridEnsembleForecaster:
    """Ensemble blending XGBoost + Random Forest with error residual stacking."""
    def __init__(self):
        self.xgb = XGBRegressor(n_estimators=35, max_depth=3, learning_rate=0.08, random_state=42, n_jobs=1)
        self.rf = RandomForestRegressor(n_estimators=30, max_depth=4, random_state=42, n_jobs=1)

    def fit(self, X: np.ndarray, y_residuals: np.ndarray):
        self.xgb.fit(X, y_residuals)
        self.rf.fit(X, y_residuals)

    def predict_residual(self, X: np.ndarray) -> np.ndarray:
        return 0.60 * self.xgb.predict(X) + 0.40 * self.rf.predict(X)
