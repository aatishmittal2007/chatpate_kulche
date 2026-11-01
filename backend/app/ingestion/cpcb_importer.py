import csv
from pathlib import Path
from typing import Optional, List
from datetime import datetime
import sqlite3

from app.core.database import get_connection
from app.schemas.data_schemas import ImportReport, CanonicalObservation
from app.ingestion.validators import (
    validate_coordinates,
    validate_pollutant_unit,
    parse_and_normalize_timestamp,
    validate_concentration_value,
)

def import_cpcb_csv(csv_path: Path, db_path: Optional[Path] = None) -> ImportReport:
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
        quality_breakdown={"valid": 0, "suspect": 0, "missing": 0, "synthetic_benchmark": 0},
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
            # Check critical fields
            loc_id = row.get("location_id") or row.get("station_id")
            raw_ts = row.get("timestamp") or row.get("date_time")
            pollutant = (row.get("pollutant") or "").strip().upper()
            raw_val = row.get("value") or row.get("concentration")

            if not loc_id or not raw_ts or not pollutant or raw_val is None:
                report.missing_critical_fields += 1
                report.rejected_records += 1
                report.details.append(f"Row {report.total_records_processed}: Missing required field.")
                continue

            # Validate pollutant
            if pollutant not in ["PM2.5", "PM10"]:
                report.rejected_records += 1
                report.details.append(f"Row {report.total_records_processed}: Unsupported pollutant '{pollutant}'.")
                continue

            # Parse timestamp
            try:
                norm_ts = parse_and_normalize_timestamp(raw_ts)
            except Exception as e:
                report.rejected_records += 1
                report.details.append(f"Row {report.total_records_processed}: {str(e)}")
                continue

            # Parse value
            try:
                val = float(raw_val)
            except ValueError:
                report.rejected_records += 1
                report.details.append(f"Row {report.total_records_processed}: Non-numeric value '{raw_val}'.")
                continue

            # Validate unit
            unit = row.get("unit", "ug/m3")
            unit_valid, unit_msg = validate_pollutant_unit(pollutant, unit)
            if not unit_valid:
                report.invalid_units += 1
                report.rejected_records += 1
                report.details.append(f"Row {report.total_records_processed}: {unit_msg}")
                continue

            # Coordinates
            lat = float(row.get("latitude", 28.6139))
            lon = float(row.get("longitude", 77.2090))
            coords_valid, coords_msg = validate_coordinates(lat, lon)
            if not coords_valid:
                report.out_of_bounds_coordinates += 1
                report.rejected_records += 1
                report.details.append(f"Row {report.total_records_processed}: {coords_msg}")
                continue

            # Station name & metadata
            station_name = row.get("station_name") or loc_id
            city = row.get("city", "Delhi")
            state = row.get("state", "Delhi")

            # Quality flag
            q_flag = row.get("quality_flag", "valid")
            if q_flag not in report.quality_breakdown:
                val_status, _ = validate_concentration_value(pollutant, val)
                q_flag = val_status

            report.quality_breakdown[q_flag] = report.quality_breakdown.get(q_flag, 0) + 1

            # Ensure station exists
            with conn:
                conn.execute(
                    """
                    INSERT OR IGNORE INTO stations (id, name, city, state, latitude, longitude, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, 1)
                    """,
                    (loc_id, station_name, city, state, lat, lon)
                )

                # Insert observation with duplicate check
                try:
                    conn.execute(
                        """
                        INSERT INTO observations (timestamp, location_id, latitude, longitude, pollutant, value, unit, source, quality_flag)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (norm_ts.isoformat(), loc_id, lat, lon, pollutant, val, unit_msg, row.get("source", "cpcb"), q_flag)
                    )
                    report.accepted_records += 1
                    if min_ts is None or norm_ts < min_ts:
                        min_ts = norm_ts
                    if max_ts is None or norm_ts > max_ts:
                        max_ts = norm_ts
                except sqlite3.IntegrityError:
                    report.duplicate_records += 1
                    report.rejected_records += 1

    conn.close()

    if min_ts and max_ts:
        report.timestamp_range = {
            "start": min_ts.isoformat(),
            "end": max_ts.isoformat()
        }

    return report
