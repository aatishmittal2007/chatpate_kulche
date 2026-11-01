import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.core.database import init_db, get_system_summary, get_db_path
from app.ingestion.cpcb_importer import import_cpcb_csv
from app.ingestion.weather_importer import import_weather_csv
from app.ingestion.firms_adapter import import_firms_csv
from app.ingestion.traffic_adapter import import_traffic_csv, import_satellite_csv

def seed():
    raw_dir = Path(__file__).resolve().parent.parent / "data" / "raw"
    db_path = get_db_path()

    print(f"--- Initializing SQLite Database at {db_path} ---")
    init_db(db_path)

    print("\n--- 1. Importing CPCB Observations ---")
    cpcb_file = raw_dir / "cpcb_observations_benchmark.csv"
    cpcb_report = import_cpcb_csv(cpcb_file, db_path)
    print(f"File: {cpcb_report.source_file}")
    print(f"Total processed: {cpcb_report.total_records_processed}")
    print(f"Accepted records: {cpcb_report.accepted_records}")
    print(f"Rejected records: {cpcb_report.rejected_records}")
    print(f"Duplicates detected: {cpcb_report.duplicate_records}")
    print(f"Missing critical fields: {cpcb_report.missing_critical_fields}")
    print(f"Out of bounds coordinates: {cpcb_report.out_of_bounds_coordinates}")
    print(f"Invalid units detected: {cpcb_report.invalid_units}")
    print(f"Quality flag breakdown: {cpcb_report.quality_breakdown}")
    if cpcb_report.timestamp_range:
        print(f"Temporal coverage: {cpcb_report.timestamp_range['start']} to {cpcb_report.timestamp_range['end']}")

    print("\n--- 2. Importing Meteorological Observations ---")
    weather_file = raw_dir / "weather_benchmark.csv"
    weather_report = import_weather_csv(weather_file, db_path)
    print(f"Total processed: {weather_report.total_records_processed}")
    print(f"Accepted records: {weather_report.accepted_records}")
    print(f"Calculated Magnus RH records: {weather_report.quality_breakdown.get('calculated_rh', 0)}")

    print("\n--- 3. Importing Traffic Indicators ---")
    traffic_file = raw_dir / "traffic_benchmark.csv"
    traffic_report = import_traffic_csv(traffic_file, db_path)
    print(f"Total processed: {traffic_report.total_records_processed}")
    print(f"Accepted records: {traffic_report.accepted_records}")

    print("\n--- 4. Importing Satellite Indicators ---")
    sat_file = raw_dir / "satellite_benchmark.csv"
    sat_report = import_satellite_csv(sat_file, db_path)
    print(f"Total processed: {sat_report.total_records_processed}")
    print(f"Accepted records: {sat_report.accepted_records}")

    print("\n--- 5. Importing NASA FIRMS Fire Detections ---")
    firms_file = raw_dir / "firms_fire_benchmark.csv"
    firms_report = import_firms_csv(firms_file, db_path)
    print(f"Total processed: {firms_report.total_records_processed}")
    print(f"Accepted records: {firms_report.accepted_records}")

    summary = get_system_summary(db_path)
    print("\n================ SYSTEM SUMMARY ================")
    for k, v in summary.items():
        print(f"  {k}: {v}")
    print("================================================")

if __name__ == "__main__":
    seed()
