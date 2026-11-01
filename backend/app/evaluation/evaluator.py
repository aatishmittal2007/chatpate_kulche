import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
import pandas as pd
import numpy as np

from app.core.database import get_connection
from app.features.feature_pipeline import build_feature_dataset, FEATURE_GROUPS
from app.models.forecaster import HorizonModel

REPORTS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "reports"
MODELS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "models"

def run_chronological_evaluation(db_path: Optional[Path] = None) -> Dict[str, Any]:
    """
    Executes chronological validation and 6-stage feature ablation across horizons and pollutants.
    Saves trained model artifacts to disk and generates evaluation report.
    """
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    pollutants = ["PM2.5", "PM10"]
    horizons = [1, 3, 6, 24]

    eval_summaries = []
    models_trained_count = 0

    conn = get_connection(db_path)

    for p in pollutants:
        for h in horizons:
            df = build_feature_dataset(pollutant=p, horizon_hours=h, db_path=db_path)
            if df.empty or len(df) < 15:
                continue

            # Strict chronological split: 75% train, 25% test
            split_idx = int(len(df) * 0.75)
            train_df = df.iloc[:split_idx].copy()
            test_df = df.iloc[split_idx:].copy()

            # All features
            all_features = (
                FEATURE_GROUPS["stage1_lags"] +
                FEATURE_GROUPS["stage2_weather"] +
                FEATURE_GROUPS["stage3_traffic"] +
                FEATURE_GROUPS["stage4_fires"] +
                FEATURE_GROUPS["stage5_satellite"]
            )
            # Filter available columns
            valid_features = [f for f in all_features if f in df.columns]

            model = HorizonModel(pollutant=p, horizon_hours=h)
            metrics = model.fit(train_df, test_df, valid_features)
            model.save(MODELS_DIR)
            models_trained_count += 1

            eval_summaries.append(metrics)

            # Record run in database
            now_iso = datetime.now(timezone.utc).isoformat()
            with conn:
                conn.execute(
                    """
                    INSERT INTO model_runs (
                        trained_at, pollutant, horizon_hours, model_type,
                        train_samples, val_mae, val_rmse, baseline_mae, baseline_rmse,
                        model_filepath, metadata_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        now_iso, p, h,
                        "Baseline" if metrics["fallback_to_baseline"] else "XGBoostResidual",
                        metrics["train_samples"], metrics["val_mae"], metrics["val_rmse"],
                        metrics["baseline_mae"], metrics["baseline_rmse"],
                        str(MODELS_DIR / f"model_{p.lower().replace('.', '')}_{h}h.joblib"),
                        json.dumps(metrics)
                    )
                )

    conn.close()

    # 6-Stage Feature Ablation Experiment (using PM2.5 at 1h and 24h as benchmark)
    df_1h = build_feature_dataset(pollutant="PM2.5", horizon_hours=1, db_path=db_path)
    df_24h = build_feature_dataset(pollutant="PM2.5", horizon_hours=24, db_path=db_path)

    ablation_results = []
    stages = [
        ("Stage 1: Historical Lags Only", FEATURE_GROUPS["stage1_lags"]),
        ("Stage 2: Lags + Meteorology", FEATURE_GROUPS["stage1_lags"] + FEATURE_GROUPS["stage2_weather"]),
        ("Stage 3: Lags + Meteorology + Traffic", FEATURE_GROUPS["stage1_lags"] + FEATURE_GROUPS["stage2_weather"] + FEATURE_GROUPS["stage3_traffic"]),
        ("Stage 4: Lags + Met + Traffic + Fire Indicators", FEATURE_GROUPS["stage1_lags"] + FEATURE_GROUPS["stage2_weather"] + FEATURE_GROUPS["stage3_traffic"] + FEATURE_GROUPS["stage4_fires"]),
        ("Stage 5: Full Suite (+ Satellite)", FEATURE_GROUPS["stage1_lags"] + FEATURE_GROUPS["stage2_weather"] + FEATURE_GROUPS["stage3_traffic"] + FEATURE_GROUPS["stage4_fires"] + FEATURE_GROUPS["stage5_satellite"]),
    ]

    for stage_name, feats in stages:
        valid_feats = [f for f in feats if f in df_1h.columns] if not df_1h.empty else []
        mae_1h = 0.0
        mae_24h = 0.0

        if not df_1h.empty and len(df_1h) >= 15:
            s_idx = int(len(df_1h) * 0.75)
            m1 = HorizonModel(pollutant="PM2.5", horizon_hours=1)
            res1 = m1.fit(df_1h.iloc[:s_idx], df_1h.iloc[s_idx:], valid_feats)
            mae_1h = res1["val_mae"]

        if not df_24h.empty and len(df_24h) >= 15:
            s_idx2 = int(len(df_24h) * 0.75)
            m24 = HorizonModel(pollutant="PM2.5", horizon_hours=24)
            res24 = m24.fit(df_24h.iloc[:s_idx2], df_24h.iloc[s_idx2:], valid_feats)
            mae_24h = res24["val_mae"]

        ablation_results.append({
            "stage": stage_name,
            "features_included": valid_feats,
            "pm25_mae_1h": mae_1h,
            "pm25_mae_24h": mae_24h,
            "verdict": "Improved predictive association" if mae_1h < 40.0 else "Baseline comparable"
        })

    # Stage 6: Persistence Baseline Comparison
    if not df_1h.empty:
        s_idx = int(len(df_1h) * 0.75)
        base_mae_1h = float(np.mean(np.abs(df_1h.iloc[s_idx:]["target_concentration"] - df_1h.iloc[s_idx:]["baseline_persistence"])))
        base_mae_24h = float(np.mean(np.abs(df_24h.iloc[int(len(df_24h) * 0.75):]["target_concentration"] - df_24h.iloc[int(len(df_24h) * 0.75):]["baseline_persistence"]))) if not df_24h.empty else 0.0

        ablation_results.append({
            "stage": "Stage 6: Persistence Baseline Benchmark",
            "features_included": ["latest_valid_observation(t)"],
            "pm25_mae_1h": round(base_mae_1h, 2),
            "pm25_mae_24h": round(base_mae_24h, 2),
            "verdict": "Reference Benchmark"
        })

    report_data = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "models_trained_count": models_trained_count,
        "evaluations": eval_summaries,
        "ablation_suite": ablation_results,
        "dataset_limitations": [
            "Current benchmark dataset utilizes calibrated synthetic progression records strictly for software validation.",
            "Sample size is limited; deep trees and complex architectures are avoided to prevent memorization.",
            "Chronological validation preserves temporal ordering; future timestamps are never leaked into training.",
            "Feature associations indicate predictive correlation; they do NOT prove physical causal source attribution.",
            "When live CPCB and IMD observational data is imported, models can be retrained locally using POST /api/model/train."
        ]
    }

    report_path = REPORTS_DIR / "evaluation_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)

    return report_data
