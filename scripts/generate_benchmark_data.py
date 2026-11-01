import csv
from pathlib import Path
from datetime import datetime, timedelta, timezone

def generate_benchmark_datasets():
    raw_dir = Path(__file__).resolve().parent.parent / "data" / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    stations = [
        {"id": "DEL_ANAND_VIHAR", "name": "Anand Vihar", "city": "Delhi", "lat": 28.6469, "lon": 77.3160, "base_pm25": 160.0},
        {"id": "DEL_PUNJABI_BAGH", "name": "Punjabi Bagh", "city": "Delhi", "lat": 28.6740, "lon": 77.1310, "base_pm25": 140.0},
        {"id": "DEL_RK_PURAM", "name": "R.K. Puram", "city": "Delhi", "lat": 28.5632, "lon": 77.1869, "base_pm25": 130.0},
        {"id": "DEL_LODHI_ROAD", "name": "Lodhi Road", "city": "Delhi", "lat": 28.5918, "lon": 77.2273, "base_pm25": 105.0},
        {"id": "PUN_PATIALA_THAPAR", "name": "Thapar Campus, Patiala", "city": "Patiala", "lat": 30.3564, "lon": 76.3647, "base_pm25": 95.0},
    ]

    # Diwali 2024: 2024-10-31
    # Generate relative days: -5, -3, -1, 0 (Diwali), +1, +2, +5
    diwali_2024 = datetime(2024, 10, 31, 0, 0, tzinfo=timezone.utc)
    relative_days = [-7, -5, -3, -2, -1, 0, 1, 2, 3, 5, 7]

    # Observation records
    cpcb_rows = []
    weather_rows = []
    traffic_rows = []
    satellite_rows = []

    for stn in stations:
        for r_day in relative_days:
            # For Day 0 and Day 1, create multiple hourly points (00:00, 06:00, 12:00, 18:00, 21:00)
            if r_day in [0, 1]:
                hours = [0, 6, 12, 18, 21]
            else:
                hours = [6, 18]

            for h in hours:
                dt = diwali_2024 + timedelta(days=r_day, hours=h)
                ts_iso = dt.isoformat()

                # Diwali relative progression multiplier
                # Pre-Diwali buildup: 1.0 to 1.4
                # Day 0 evening & Day 1 morning peak: 2.8 to 4.2x baseline
                # Post-Diwali slow dissipation: 2.0 to 1.1x
                if r_day < 0:
                    progression_factor = 1.0 + (0.05 * (r_day + 7))
                elif r_day == 0:
                    progression_factor = 2.2 if h < 18 else 3.8
                elif r_day == 1:
                    progression_factor = 3.4 if h < 12 else 2.1
                else:
                    progression_factor = max(1.1, 2.0 - (0.15 * r_day))

                # Diurnal variation: evening peak
                diurnal = 1.2 if h in [18, 21] else 0.95

                pm25 = round(stn["base_pm25"] * progression_factor * diurnal, 1)
                pm10 = round(pm25 * 1.75, 1)

                # Weather: lower temperature, high humidity, low wind speed during Diwali night
                temp = round(26.0 - (0.4 * r_day) - (5.0 if h in [0, 21] else 0.0), 1)
                dp = round(temp - (3.0 if r_day in [0, 1] else 6.0), 1)
                ws = round(1.2 if r_day in [0, 1] and h in [18, 21] else 2.8, 1)
                wd = 310.0 # North-westerly transport from Punjab/Haryana

                # Traffic
                veh_count = 1400 if h in [18, 21] else 850
                speed = 22.0 if h in [18, 21] else 38.0

                # Satellite
                aod = round(0.45 * progression_factor, 2)
                ai = round(1.1 * progression_factor, 2)

                # CPCB
                cpcb_rows.append({
                    "timestamp": ts_iso,
                    "location_id": stn["id"],
                    "station_name": stn["name"],
                    "latitude": stn["lat"],
                    "longitude": stn["lon"],
                    "pollutant": "PM2.5",
                    "value": pm25,
                    "unit": "ug/m3",
                    "source": "synthetic_cpcb_benchmark",
                    "quality_flag": "synthetic_benchmark"
                })
                cpcb_rows.append({
                    "timestamp": ts_iso,
                    "location_id": stn["id"],
                    "station_name": stn["name"],
                    "latitude": stn["lat"],
                    "longitude": stn["lon"],
                    "pollutant": "PM10",
                    "value": pm10,
                    "unit": "ug/m3",
                    "source": "synthetic_cpcb_benchmark",
                    "quality_flag": "synthetic_benchmark"
                })

                # Weather (omit relative_humidity on alternate rows to test Magnus RH calculation)
                weather_dict = {
                    "timestamp": ts_iso,
                    "location_id": stn["id"],
                    "temperature_c": temp,
                    "dew_point_c": dp,
                    "relative_humidity": "" if (len(weather_rows) % 2 == 0) else "82.5",
                    "wind_speed_ms": ws,
                    "wind_direction_deg": wd,
                    "surface_pressure_hpa": 1014.0,
                    "boundary_layer_height_m": 420.0,
                    "source": "synthetic_weather_benchmark"
                }
                weather_rows.append(weather_dict)

                # Traffic
                traffic_rows.append({
                    "timestamp": ts_iso,
                    "location_id": stn["id"],
                    "vehicle_count_hourly": veh_count,
                    "average_speed_kmh": speed,
                    "free_flow_speed_kmh": 50.0,
                    "estimated_emissions_pm25_kgh": round(veh_count * 0.00015 * 5.0, 3)
                })

                # Satellite
                satellite_rows.append({
                    "timestamp": ts_iso,
                    "location_id": stn["id"],
                    "aerosol_optical_depth": aod,
                    "aerosol_index": ai,
                    "data_quality": "synthetic_benchmark",
                    "source": "synthetic_sentinel5p"
                })

    # Add deliberate validation test cases to cpcb_rows:
    # 1. Duplicate row
    cpcb_rows.append(cpcb_rows[0].copy())
    # 2. Row with missing critical value
    cpcb_rows.append({
        "timestamp": "2024-10-31T06:00:00Z",
        "location_id": "DEL_ANAND_VIHAR",
        "station_name": "Anand Vihar",
        "latitude": 28.6469,
        "longitude": 77.3160,
        "pollutant": "PM2.5",
        "value": "",
        "unit": "ug/m3",
        "source": "test_invalid",
        "quality_flag": "test"
    })
    # 3. Row with out of bounds latitude
    cpcb_rows.append({
        "timestamp": "2024-10-31T07:00:00Z",
        "location_id": "DEL_ANAND_VIHAR",
        "station_name": "Anand Vihar",
        "latitude": 98.6469, # Invalid lat!
        "longitude": 77.3160,
        "pollutant": "PM2.5",
        "value": 150.0,
        "unit": "ug/m3",
        "source": "test_invalid",
        "quality_flag": "test"
    })
    # 4. Row with invalid unit
    cpcb_rows.append({
        "timestamp": "2024-10-31T08:00:00Z",
        "location_id": "DEL_ANAND_VIHAR",
        "station_name": "Anand Vihar",
        "latitude": 28.6469,
        "longitude": 77.3160,
        "pollutant": "PM2.5",
        "value": 150.0,
        "unit": "parts_per_million", # Invalid unit!
        "source": "test_invalid",
        "quality_flag": "test"
    })

    # Generate FIRMS fire detections (upwind agricultural regions in Punjab / Haryana)
    firms_rows = [
        {"id": "FIRMS_PUN_01", "timestamp": "2024-10-29T14:30:00Z", "latitude": 30.850, "longitude": 75.820, "frp": 45.2, "confidence": 88.0, "source": "synthetic_firms_viirs"},
        {"id": "FIRMS_PUN_02", "timestamp": "2024-10-30T13:45:00Z", "latitude": 30.620, "longitude": 76.110, "frp": 62.8, "confidence": 92.0, "source": "synthetic_firms_viirs"},
        {"id": "FIRMS_PUN_03", "timestamp": "2024-10-31T14:15:00Z", "latitude": 30.410, "longitude": 76.450, "frp": 85.5, "confidence": 95.0, "source": "synthetic_firms_viirs"},
        {"id": "FIRMS_HAR_01", "timestamp": "2024-10-31T15:20:00Z", "latitude": 29.850, "longitude": 76.880, "frp": 38.0, "confidence": 82.0, "source": "synthetic_firms_viirs"},
        {"id": "FIRMS_PUN_04", "timestamp": "2024-11-01T13:50:00Z", "latitude": 30.730, "longitude": 75.950, "frp": 54.1, "confidence": 90.0, "source": "synthetic_firms_viirs"},
    ]

    # Write CSV files
    def write_csv(filepath, rows, fieldnames):
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

    write_csv(raw_dir / "cpcb_observations_benchmark.csv", cpcb_rows, list(cpcb_rows[0].keys()))
    write_csv(raw_dir / "weather_benchmark.csv", weather_rows, list(weather_rows[0].keys()))
    write_csv(raw_dir / "traffic_benchmark.csv", traffic_rows, list(traffic_rows[0].keys()))
    write_csv(raw_dir / "satellite_benchmark.csv", satellite_rows, list(satellite_rows[0].keys()))
    write_csv(raw_dir / "firms_fire_benchmark.csv", firms_rows, list(firms_rows[0].keys()))

    print(f"Generated {len(cpcb_rows)} CPCB benchmark rows in {raw_dir / 'cpcb_observations_benchmark.csv'}")
    print(f"Generated {len(weather_rows)} Weather benchmark rows")
    print(f"Generated {len(traffic_rows)} Traffic benchmark rows")
    print(f"Generated {len(satellite_rows)} Satellite benchmark rows")
    print(f"Generated {len(firms_rows)} FIRMS Fire benchmark rows")

if __name__ == "__main__":
    generate_benchmark_datasets()
