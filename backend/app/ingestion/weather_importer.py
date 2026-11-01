import csv
from pathlib import Path
from typing import Optional
from datetime import datetime
import sqlite3

from app.core.database import get_connection
from app.schemas.data_schemas import ImportReport
from app.ingestion.validators import parse_and_normalize_timestamp, calculate_magnus_rh

def import_weather_csv(csv_path: Path, db_path: Optional[Path] = None) -> ImportReport:
    conn = get_connection(db_path)
    report = ImportReport(
        source_file=str(csv_path),
        total_records_processed=0,
        accepted_records=0,
        rejected_records=0,
        duplicate_records=0,
        missing_critical_fields=0,
        out_of_bounds_coordinates=0,
        invalid_units=0,
        quality_breakdown={"valid": 0, "calculated_rh": 0},
        details=[]
    )

    if not csv_path.exists():
        report.details.append(f"File {csv_path} does not exist.")
        return report

    min_ts: Optional[datetime] = None
    max_ts: Optional[datetime] = None

    with open(csv_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            report.total_records_processed += 1
            loc_id = row.get("location_id") or row.get("station_id")
            raw_ts = row.get("timestamp")
            raw_t = row.get("temperature_c") or row.get("temp")
            raw_dp = row.get("dew_point_c") or row.get("dew_point")
            raw_ws = row.get("wind_speed_ms") or row.get("wind_speed")
            raw_wd = row.get("wind_direction_deg") or row.get("wind_direction")

            if not loc_id or not raw_ts or raw_t is None or raw_ws is None or raw_wd is None:
                report.missing_critical_fields += 1
                report.rejected_records += 1
                continue

            try:
                norm_ts = parse_and_normalize_timestamp(raw_ts)
                t_c = float(raw_t)
                ws = float(raw_ws)
                wd = float(raw_wd) % 360.0
                dp_c = float(raw_dp) if raw_dp is not None else (t_c - 5.0) # default reasonable depression
            except Exception as e:
                report.rejected_records += 1
                report.details.append(f"Row {report.total_records_processed}: {str(e)}")
                continue

            raw_rh = row.get("relative_humidity")
            if raw_rh is not None and str(raw_rh).strip() != "":
                rh = float(raw_rh)
                report.quality_breakdown["valid"] += 1
            else:
                rh = calculate_magnus_rh(t_c, dp_c)
                report.quality_breakdown["calculated_rh"] += 1

            pressure = float(row.get("surface_pressure_hpa", 1013.25))
            blh = float(row.get("boundary_layer_height_m", 500.0))

            try:
                with conn:
                    conn.execute(
                        """
                        INSERT INTO meteorology (
                            timestamp, location_id, temperature_c, dew_point_c,
                            relative_humidity, wind_speed_ms, wind_direction_deg,
                            surface_pressure_hpa, boundary_layer_height_m, source
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(location_id, timestamp) DO UPDATE SET
                            temperature_c = excluded.temperature_c,
                            dew_point_c = excluded.dew_point_c,
                            relative_humidity = excluded.relative_humidity,
                            wind_speed_ms = excluded.wind_speed_ms,
                            wind_direction_deg = excluded.wind_direction_deg
                        """,
                        (norm_ts.isoformat(), loc_id, t_c, dp_c, rh, ws, wd, pressure, blh, row.get("source", "imd_weather"))
                    )
                report.accepted_records += 1
                if min_ts is None or norm_ts < min_ts:
                    min_ts = norm_ts
                if max_ts is None or norm_ts > max_ts:
                    max_ts = norm_ts
            except Exception as e:
                report.rejected_records += 1
                report.details.append(f"Row {report.total_records_processed}: {str(e)}")

    conn.close()
    if min_ts and max_ts:
        report.timestamp_range = {"start": min_ts.isoformat(), "end": max_ts.isoformat()}
    return report
