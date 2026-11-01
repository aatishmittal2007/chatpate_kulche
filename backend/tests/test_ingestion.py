import pytest
from pathlib import Path
import tempfile
import csv

from app.ingestion.validators import (
    validate_coordinates,
    validate_pollutant_unit,
    parse_and_normalize_timestamp,
    validate_concentration_value,
    calculate_magnus_rh
)
from app.ingestion.cpcb_importer import import_cpcb_csv
from app.core.database import init_db, get_connection

def test_coordinate_validation():
    # Valid
    ok, _ = validate_coordinates(28.6139, 77.2090)
    assert ok is True

    # Invalid latitude
    bad_lat, msg1 = validate_coordinates(95.0, 77.2)
    assert bad_lat is False
    assert "Latitude 95.0 out of planetary bounds" in msg1

    # Invalid longitude
    bad_lon, msg2 = validate_coordinates(28.6, -190.0)
    assert bad_lon is False
    assert "Longitude -190.0 out of planetary bounds" in msg2

def test_unit_validation():
    ok, unit = validate_pollutant_unit("PM2.5", "ug/m3")
    assert ok is True
    assert unit == "ug/m3"

    ok2, unit2 = validate_pollutant_unit("PM2.5", "µg/m³")
    assert ok2 is True
    assert unit2 == "ug/m3"

    bad, msg = validate_pollutant_unit("PM2.5", "ppm")
    assert bad is False
    assert "Invalid unit" in msg

def test_timestamp_parsing():
    # ISO format
    dt1 = parse_and_normalize_timestamp("2024-10-31T18:00:00Z")
    assert dt1.year == 2024 and dt1.month == 10 and dt1.day == 31 and dt1.hour == 18

    # Common CPCB format
    dt2 = parse_and_normalize_timestamp("2024-10-31 18:00:00")
    assert dt2.year == 2024 and dt2.hour == 18

    # Date with slashes
    dt3 = parse_and_normalize_timestamp("31/10/2024 18:00:00")
    assert dt3.year == 2024 and dt3.day == 31

    with pytest.raises(ValueError):
        parse_and_normalize_timestamp("invalid-date-string")

def test_concentration_bounds():
    status1, _ = validate_concentration_value("PM2.5", 150.0)
    assert status1 == "valid"

    status_neg, _ = validate_concentration_value("PM2.5", -5.0)
    assert status_neg == "suspect"

    status_extreme, _ = validate_concentration_value("PM2.5", 3500.0)
    assert status_extreme == "suspect"

def test_cpcb_importer_report_on_temporary_file(tmp_path):
    test_db = tmp_path / "test.db"
    init_db(test_db)

    csv_file = tmp_path / "sample.csv"
    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["location_id", "station_name", "timestamp", "pollutant", "value", "unit", "latitude", "longitude"])
        # Valid row
        writer.writerow(["TEST_STN", "Test Station", "2024-10-31 12:00:00", "PM2.5", "120.0", "ug/m3", "28.5", "77.2"])
        # Duplicate row
        writer.writerow(["TEST_STN", "Test Station", "2024-10-31 12:00:00", "PM2.5", "120.0", "ug/m3", "28.5", "77.2"])
        # Out of bounds lat
        writer.writerow(["TEST_STN", "Test Station", "2024-10-31 13:00:00", "PM2.5", "130.0", "ug/m3", "128.5", "77.2"])
        # Invalid unit
        writer.writerow(["TEST_STN", "Test Station", "2024-10-31 14:00:00", "PM2.5", "140.0", "ppb", "28.5", "77.2"])
        # Missing value
        writer.writerow(["TEST_STN", "Test Station", "2024-10-31 15:00:00", "PM2.5", "", "ug/m3", "28.5", "77.2"])

    report = import_cpcb_csv(csv_file, test_db)
    assert report.total_records_processed == 5
    assert report.accepted_records == 1
    assert report.duplicate_records == 1
    assert report.out_of_bounds_coordinates == 1
    assert report.invalid_units == 1
    assert report.missing_critical_fields == 1
