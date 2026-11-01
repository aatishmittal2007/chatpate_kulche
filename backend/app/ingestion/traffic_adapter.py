import csv
from pathlib import Path
from typing import Optional
from datetime import datetime
import sqlite3

from app.core.database import get_connection
from app.schemas.data_schemas import ImportReport
from app.ingestion.validators import parse_and_normalize_timestamp

def import_traffic_csv(csv_path: Path, db_path: Optional[Path] = None) -> ImportReport:
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
        quality_breakdown={"valid": 0},
        details=[]
    )

    if not csv_path.exists():
        report.details.append(f"File {csv_path} does not exist.")
        return report

    with open(csv_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            report.total_records_processed += 1
            loc_id = row.get("location_id")
            raw_ts = row.get("timestamp")
            raw_count = row.get("vehicle_count_hourly") or row.get("volume")
            raw_speed = row.get("average_speed_kmh") or row.get("speed")

            if not loc_id or not raw_ts or raw_count is None or raw_speed is None:
                report.missing_critical_fields += 1
                report.rejected_records += 1
                continue

            try:
                ts = parse_and_normalize_timestamp(raw_ts)
                count = int(raw_count)
                speed = float(raw_speed)
                # Congestion index: ratio of slowdown from free flow speed (e.g. 50 km/h)
                free_flow = float(row.get("free_flow_speed_kmh", 50.0))
                congestion = max(0.0, min(1.0, 1.0 - (speed / free_flow)))
                emissions = float(row.get("estimated_emissions_pm25_kgh", count * 0.00015 * 5.0)) # proxy formula

                with conn:
                    conn.execute(
                        """
                        INSERT INTO traffic (
                            timestamp, location_id, vehicle_count_hourly, average_speed_kmh,
                            congestion_index, estimated_emissions_pm25_kgh
                        ) VALUES (?, ?, ?, ?, ?, ?)
                        ON CONFLICT(location_id, timestamp) DO UPDATE SET
                            vehicle_count_hourly = excluded.vehicle_count_hourly,
                            average_speed_kmh = excluded.average_speed_kmh,
                            congestion_index = excluded.congestion_index,
                            estimated_emissions_pm25_kgh = excluded.estimated_emissions_pm25_kgh
                        """,
                        (ts.isoformat(), loc_id, count, speed, congestion, emissions)
                    )
                report.accepted_records += 1
                report.quality_breakdown["valid"] += 1
            except Exception as e:
                report.rejected_records += 1
                report.details.append(f"Row {report.total_records_processed}: {str(e)}")

    conn.close()
    return report

def import_satellite_csv(csv_path: Path, db_path: Optional[Path] = None) -> ImportReport:
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
        quality_breakdown={"valid": 0},
        details=[]
    )

    if not csv_path.exists():
        report.details.append(f"File {csv_path} does not exist.")
        return report

    with open(csv_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            report.total_records_processed += 1
            loc_id = row.get("location_id")
            raw_ts = row.get("timestamp")
            raw_aod = row.get("aerosol_optical_depth") or row.get("aod")
            raw_ai = row.get("aerosol_index") or row.get("ai")

            if not loc_id or not raw_ts or raw_aod is None:
                report.missing_critical_fields += 1
                report.rejected_records += 1
                continue

            try:
                ts = parse_and_normalize_timestamp(raw_ts)
                aod = float(raw_aod)
                ai = float(raw_ai) if raw_ai is not None else 1.2

                with conn:
                    conn.execute(
                        """
                        INSERT INTO satellite_indicators (
                            timestamp, location_id, aerosol_optical_depth, aerosol_index,
                            data_quality, source
                        ) VALUES (?, ?, ?, ?, ?, ?)
                        ON CONFLICT(location_id, timestamp) DO UPDATE SET
                            aerosol_optical_depth = excluded.aerosol_optical_depth,
                            aerosol_index = excluded.aerosol_index
                        """,
                        (ts.isoformat(), loc_id, aod, ai, row.get("data_quality", "standard"), row.get("source", "sentinel5p"))
                    )
                report.accepted_records += 1
                report.quality_breakdown["valid"] += 1
            except Exception as e:
                report.rejected_records += 1
                report.details.append(f"Row {report.total_records_processed}: {str(e)}")

    conn.close()
    return report
