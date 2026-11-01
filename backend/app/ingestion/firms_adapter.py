import csv
from pathlib import Path
from typing import Optional
from datetime import datetime
import sqlite3

from app.core.database import get_connection
from app.schemas.data_schemas import ImportReport
from app.ingestion.validators import parse_and_normalize_timestamp, validate_coordinates

def import_firms_csv(csv_path: Path, db_path: Optional[Path] = None) -> ImportReport:
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
            raw_lat = row.get("latitude")
            raw_lon = row.get("longitude")
            raw_date = row.get("acq_date") or row.get("timestamp")
            raw_time = row.get("acq_time", "00:00")
            frp = float(row.get("frp", 10.0))
            confidence = float(row.get("confidence", 80.0))

            if not raw_lat or not raw_lon or not raw_date:
                report.missing_critical_fields += 1
                report.rejected_records += 1
                continue

            try:
                lat = float(raw_lat)
                lon = float(raw_lon)
                c_ok, c_msg = validate_coordinates(lat, lon)
                if not c_ok:
                    report.out_of_bounds_coordinates += 1
                    report.rejected_records += 1
                    continue

                # Construct timestamp string if date + time
                if "T" in raw_date:
                    ts = parse_and_normalize_timestamp(raw_date)
                else:
                    time_clean = raw_time.zfill(4)
                    hh = time_clean[:2]
                    mm = time_clean[2:4]
                    ts = parse_and_normalize_timestamp(f"{raw_date} {hh}:{mm}:00")

                fire_id = row.get("id") or f"FIRE_{lat:.3f}_{lon:.3f}_{ts.strftime('%Y%m%d%H%M')}"
                with conn:
                    conn.execute(
                        """
                        INSERT OR REPLACE INTO fire_detections (id, timestamp, latitude, longitude, frp, confidence, source)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (fire_id, ts.isoformat(), lat, lon, frp, confidence, row.get("source", "nasa_firms"))
                    )
                report.accepted_records += 1
                report.quality_breakdown["valid"] += 1
            except Exception as e:
                report.rejected_records += 1
                report.details.append(f"Row {report.total_records_processed}: {str(e)}")

    conn.close()
    return report
