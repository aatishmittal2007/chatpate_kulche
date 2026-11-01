DIWALI AIR QUALITY PREDICTION — EXPERIMENT REPORT

Source rows: 2,589,083; modeling subset rows: 705,691; selected stations: 15; dates: 2015-01-01 01:00:00 to 2020-07-01 00:00:00
PM2.5 nonmissing: 527,868 (74.8%)
Valid next-hour target rows: 527,865
Training sample rows: 100,000; validation rows: 111,375; 2019 test rows: 120,446

TOP TEST RESULTS BY EVALUATION WINDOW (lower MAE/RMSE is better)

All_2019
            Model      n    MAE   RMSE
 Residual_XGBoost 119055 12.711 26.518
Weighted_Ensemble 119055 12.768 26.334
          XGBoost 119055 12.974 26.517
         LightGBM 119055 13.093 26.695
     RandomForest 119055 13.159 27.024
      Persistence 119055 13.490 28.591

Diwali_7d
            Model    n    MAE   RMSE
 Residual_XGBoost 4592 15.965 30.256
Weighted_Ensemble 4592 16.080 29.902
          XGBoost 4592 16.339 30.243
         LightGBM 4592 16.609 30.474
     RandomForest 4592 16.729 30.342
      Persistence 4592 17.464 33.649

Diwali_3d
            Model    n    MAE   RMSE
 Residual_XGBoost 1946 17.618 36.173
Weighted_Ensemble 1946 17.721 35.338
          XGBoost 1946 17.944 35.661
         LightGBM 1946 18.280 35.751
     RandomForest 1946 18.556 36.035
      Persistence 1946 20.588 41.956

VALIDATION-OPTIMIZED ENSEMBLE WEIGHTS
           Model  Weight
    RandomForest    0.00
         XGBoost    0.05
        LightGBM    0.45
Residual_XGBoost    0.50

WEATHER / FIRE EXTENSIONS
Not evaluated because no matched weather or fire data was included in the uploaded ZIP. Add timestamped hourly weather (temperature, dew point, wind speed/direction, rainfall) and geolocated active-fire observations (time, coordinates, FRP/confidence) before claiming those features improve the model.

LIMITATIONS
- The dataset ends 2020-07-01 and cannot validate Diwali 2020 or 2026.
- StationCode is an encoded station identifier and should not be interpreted as a numeric spatial coordinate.
- Diwali dates are calendar features; Diwali-window evaluation depends on observations available in each year.
- Lag features are based on available station records; exact time-gap checks are applied to explicit lags and next-hour targets.
- Model scores are empirical on this split and do not guarantee generalization to new cities or future years.
