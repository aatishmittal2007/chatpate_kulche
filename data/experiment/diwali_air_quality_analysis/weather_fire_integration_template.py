"""Merge externally downloaded weather and satellite-fire data into station-hour features.

Required inputs:
- station_coordinates.csv: StationId, latitude, longitude
- hourly_weather.csv: StationId, Datetime, temperature_2m, dew_point_2m,
  relative_humidity_2m, wind_speed_10m, wind_direction_10m, precipitation
- fire_detections.csv: acquisition_datetime, latitude, longitude, frp, confidence
- station_hour_features.csv: station-hour rows with existing engineered features

This template deliberately does not fabricate coordinates or observations.
"""
import numpy as np
import pandas as pd
from sklearn.neighbors import BallTree

coords = pd.read_csv("station_coordinates.csv")
weather = pd.read_csv("hourly_weather.csv", parse_dates=["Datetime"])
fire = pd.read_csv("fire_detections.csv", parse_dates=["acquisition_datetime"])
base = pd.read_csv("station_hour_features.csv", parse_dates=["Datetime"])

# Match weather by station and exact timestamp. If only city-level weather exists,
# join by City + Datetime and document that it is not neighborhood-level weather.
base = base.merge(weather, on=["StationId", "Datetime"], how="left", validate="many_to_one")

# Aggregate fire detections within 25 km of each station, by detection hour.
# 25 km is a tunable spatial buffer, not a guarantee of plume impact or transport.
fire = fire.dropna(subset=["latitude", "longitude", "acquisition_datetime"])
fire_rad = np.radians(fire[["latitude", "longitude"]].to_numpy())
tree = BallTree(fire_rad, metric="haversine")
fire_parts = []
for row in coords.itertuples(index=False):
    station_rad = np.radians([[row.latitude, row.longitude]])
    nearby_idx = tree.query_radius(station_rad, r=25 / 6371.0)[0]
    if len(nearby_idx) == 0:
        continue
    part = fire.iloc[nearby_idx].copy()
    part["StationId"] = row.StationId
    part["Datetime"] = part["acquisition_datetime"].dt.floor("h")
    fire_parts.append(part[["StationId", "Datetime", "frp", "confidence"]])

if fire_parts:
    nearby = pd.concat(fire_parts, ignore_index=True)
    fire_hourly = nearby.groupby(["StationId", "Datetime"], as_index=False).agg(
        fire_count=("frp", "size"),
        fire_frp_sum=("frp", "sum"),
        fire_frp_max=("frp", "max"),
        fire_confidence_mean=("confidence", "mean"),
    )
    base = base.merge(fire_hourly, on=["StationId", "Datetime"], how="left", validate="one_to_one")
else:
    base["fire_count"] = 0
    base["fire_frp_sum"] = 0.0
    base["fire_frp_max"] = 0.0
    base["fire_confidence_mean"] = np.nan

for col in ["fire_count", "fire_frp_sum", "fire_frp_max"]:
    base[col] = base[col].fillna(0)
base.to_csv("station_hour_weather_fire_features.csv", index=False)
print("Saved station_hour_weather_fire_features.csv")
