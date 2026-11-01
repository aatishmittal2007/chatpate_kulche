import sqlite3
import os
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent.parent.parent / "data" / "processed" / "airsense.db"

def get_db_path() -> Path:
    env_path = os.getenv("AIRSENSE_DB_PATH")
    if env_path:
        return Path(env_path)
    return DEFAULT_DB_PATH

def get_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    path = db_path or get_db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db(db_path: Optional[Path] = None):
    conn = get_connection(db_path)
    with conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS stations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            is_active INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS observations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            location_id TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            pollutant TEXT NOT NULL,
            value REAL NOT NULL,
            unit TEXT NOT NULL,
            source TEXT NOT NULL,
            quality_flag TEXT NOT NULL,
            FOREIGN KEY (location_id) REFERENCES stations(id),
            UNIQUE (location_id, pollutant, timestamp)
        );

        CREATE INDEX IF NOT EXISTS idx_obs_time_loc ON observations(timestamp, location_id, pollutant);

        CREATE TABLE IF NOT EXISTS meteorology (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            location_id TEXT NOT NULL,
            temperature_c REAL NOT NULL,
            dew_point_c REAL NOT NULL,
            relative_humidity REAL NOT NULL,
            wind_speed_ms REAL NOT NULL,
            wind_direction_deg REAL NOT NULL,
            surface_pressure_hpa REAL,
            boundary_layer_height_m REAL,
            source TEXT NOT NULL,
            FOREIGN KEY (location_id) REFERENCES stations(id),
            UNIQUE (location_id, timestamp)
        );

        CREATE INDEX IF NOT EXISTS idx_met_time_loc ON meteorology(timestamp, location_id);

        CREATE TABLE IF NOT EXISTS traffic (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            location_id TEXT NOT NULL,
            vehicle_count_hourly INTEGER NOT NULL,
            average_speed_kmh REAL NOT NULL,
            congestion_index REAL NOT NULL,
            estimated_emissions_pm25_kgh REAL,
            FOREIGN KEY (location_id) REFERENCES stations(id),
            UNIQUE (location_id, timestamp)
        );

        CREATE TABLE IF NOT EXISTS fire_detections (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            frp REAL NOT NULL,
            confidence REAL NOT NULL,
            source TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_fire_time ON fire_detections(timestamp);

        CREATE TABLE IF NOT EXISTS satellite_indicators (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            location_id TEXT NOT NULL,
            aerosol_optical_depth REAL NOT NULL,
            aerosol_index REAL NOT NULL,
            data_quality TEXT NOT NULL,
            source TEXT NOT NULL,
            FOREIGN KEY (location_id) REFERENCES stations(id),
            UNIQUE (location_id, timestamp)
        );

        CREATE TABLE IF NOT EXISTS model_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trained_at TEXT NOT NULL,
            pollutant TEXT NOT NULL,
            horizon_hours INTEGER NOT NULL,
            model_type TEXT NOT NULL,
            train_samples INTEGER NOT NULL,
            val_mae REAL NOT NULL,
            val_rmse REAL NOT NULL,
            baseline_mae REAL NOT NULL,
            baseline_rmse REAL NOT NULL,
            model_filepath TEXT,
            metadata_json TEXT
        );

        CREATE TABLE IF NOT EXISTS forecast_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            generated_at TEXT NOT NULL,
            location_id TEXT NOT NULL,
            pollutant TEXT NOT NULL,
            horizon_hours INTEGER NOT NULL,
            target_timestamp TEXT NOT NULL,
            point_forecast REAL NOT NULL,
            lower_bound_80 REAL,
            upper_bound_80 REAL,
            lower_bound_95 REAL,
            upper_bound_95 REAL,
            baseline_persistence REAL,
            baseline_historical REAL,
            model_name TEXT NOT NULL,
            uncertainty_calibrated INTEGER DEFAULT 1,
            residual_correction_applied INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS community_reports (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            neighbourhood_id TEXT,
            category TEXT NOT NULL,
            description TEXT,
            visibility_level TEXT NOT NULL,
            smell_intensity TEXT NOT NULL,
            cracker_activity TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            reliability_score REAL DEFAULT 50.0,
            upvotes INTEGER DEFAULT 0,
            reporter_hash TEXT NOT NULL,
            FOREIGN KEY (neighbourhood_id) REFERENCES stations(id)
        );

        CREATE INDEX IF NOT EXISTS idx_comm_time ON community_reports(timestamp);

        CREATE TABLE IF NOT EXISTS road_corridors (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            from_point TEXT NOT NULL,
            to_point TEXT NOT NULL,
            length_km REAL NOT NULL,
            baseline_speed_kmh REAL NOT NULL,
            current_speed_kmh REAL NOT NULL,
            vehicle_density_per_km REAL NOT NULL,
            congestion_index REAL NOT NULL,
            estimated_pm25_kgh REAL NOT NULL,
            lat_start REAL NOT NULL,
            lon_start REAL NOT NULL,
            lat_end REAL NOT NULL,
            lon_end REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS vehicle_detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            corridor_id TEXT NOT NULL,
            cars INTEGER NOT NULL,
            buses INTEGER NOT NULL,
            trucks INTEGER NOT NULL,
            motorcycles INTEGER NOT NULL,
            three_wheelers INTEGER NOT NULL,
            average_speed_kmh REAL NOT NULL,
            FOREIGN KEY (corridor_id) REFERENCES road_corridors(id)
        );

        CREATE INDEX IF NOT EXISTS idx_veh_time ON vehicle_detections(timestamp);

        CREATE TABLE IF NOT EXISTS workflow_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workflow_id TEXT NOT NULL,
            workflow_name TEXT NOT NULL,
            run_at TEXT NOT NULL,
            status TEXT NOT NULL,
            records_processed INTEGER DEFAULT 0,
            duration_ms INTEGER DEFAULT 0,
            error_message TEXT
        );
        """)

        # Seed initial stations if empty
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM stations")
        if cur.fetchone()[0] == 0:
            seed_default_stations(conn)

        # Seed initial corridors if empty
        cur.execute("SELECT COUNT(*) FROM road_corridors")
        if cur.fetchone()[0] == 0:
            seed_corridors(conn)

        # Seed initial community reports if empty
        cur.execute("SELECT COUNT(*) FROM community_reports")
        if cur.fetchone()[0] == 0:
            seed_community_reports(conn)

    conn.close()

def seed_default_stations(conn: sqlite3.Connection):
    stations = [
        ("DEL_ANAND_VIHAR", "Anand Vihar", "Delhi", "Delhi", 28.6469, 77.3160, 1),
        ("DEL_PUNJABI_BAGH", "Punjabi Bagh", "Delhi", "Delhi", 28.6740, 77.1310, 1),
        ("DEL_RK_PURAM", "R.K. Puram", "Delhi", "Delhi", 28.5632, 77.1869, 1),
        ("DEL_LODHI_ROAD", "Lodhi Road", "Delhi", "Delhi", 28.5918, 77.2273, 1),
        ("PUN_PATIALA_THAPAR", "Thapar Campus, Patiala", "Patiala", "Punjab", 30.3564, 76.3647, 1)
    ]
    cur = conn.cursor()
    cur.executemany("""
    INSERT OR IGNORE INTO stations (id, name, city, state, latitude, longitude, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, stations)

def seed_corridors(conn: sqlite3.Connection):
    corridors = [
        ("CORR_RING_ROAD", "Inner Ring Road (Ashram - Moti Bagh)", "Ashram Chowk", "Moti Bagh", 12.4, 55.0, 24.5, 340.0, 0.72, 8.4, 28.5710, 77.2588, 28.5855, 77.1685),
        ("CORR_OUTER_RING", "Outer Ring Road (IIT - Munirka)", "IIT Delhi Gate", "Munirka Flyover", 8.6, 60.0, 31.0, 280.0, 0.58, 6.2, 28.5450, 77.1925, 28.5580, 77.1650),
        ("CORR_NH48", "NH-48 Airport Expressway (Dhaula Kuan - Mahipalpur)", "Dhaula Kuan", "Mahipalpur", 11.2, 70.0, 38.0, 310.0, 0.52, 9.1, 28.5920, 77.1610, 28.5350, 77.1210),
        ("CORR_BARAPULLAH", "Barapullah Elevated Corridor", "Sarai Kale Khan", "INA Market", 7.8, 65.0, 48.0, 190.0, 0.32, 3.8, 28.5880, 77.2560, 28.5750, 77.2110),
        ("CORR_VIKAS_MARG", "Vikas Marg (Laxmi Nagar - ITO)", "Laxmi Nagar Metro", "ITO Junction", 5.5, 45.0, 16.0, 420.0, 0.85, 11.6, 28.6310, 77.2770, 28.6290, 77.2420),
        ("CORR_GT_KARNAL", "GT Karnal Road (Mukarba - Azadpur)", "Mukarba Chowk", "Azadpur Mandi", 6.8, 50.0, 20.0, 390.0, 0.78, 10.2, 28.7360, 77.1530, 28.7070, 77.1770),
        ("CORR_MATHURA_RD", "Mathura Road (Badarpur - Ashram)", "Badarpur Border", "Ashram", 13.5, 50.0, 22.0, 360.0, 0.75, 9.8, 28.4980, 77.3010, 28.5710, 77.2588)
    ]
    cur = conn.cursor()
    cur.executemany("""
    INSERT INTO road_corridors (
        id, name, from_point, to_point, length_km, baseline_speed_kmh,
        current_speed_kmh, vehicle_density_per_km, congestion_index,
        estimated_pm25_kgh, lat_start, lon_start, lat_end, lon_end
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, corridors)

    # Seed sample vehicle detections for corridors
    now_iso = datetime.now(timezone.utc).isoformat()
    detections = [
        (now_iso, "CORR_RING_ROAD", 1850, 120, 95, 1420, 680, 24.5),
        (now_iso, "CORR_OUTER_RING", 1450, 90, 65, 980, 420, 31.0),
        (now_iso, "CORR_NH48", 2200, 140, 180, 1100, 350, 38.0),
        (now_iso, "CORR_BARAPULLAH", 1100, 45, 12, 750, 210, 48.0),
        (now_iso, "CORR_VIKAS_MARG", 1600, 110, 85, 1950, 890, 16.0),
        (now_iso, "CORR_GT_KARNAL", 1300, 150, 240, 1200, 510, 20.0),
        (now_iso, "CORR_MATHURA_RD", 1750, 130, 190, 1350, 620, 22.0),
    ]
    cur.executemany("""
    INSERT INTO vehicle_detections (
        timestamp, corridor_id, cars, buses, trucks, motorcycles, three_wheelers, average_speed_kmh
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, detections)

def seed_community_reports(conn: sqlite3.Connection):
    now_iso = datetime.now(timezone.utc).isoformat()
    reports = [
        ("REP_001", now_iso, 28.6485, 77.3195, "DEL_ANAND_VIHAR", "Firecracker Burning", "Intense firecracker bursts observed near ISBT Anand Vihar with dense white smoke reducing visibility.", "< 200m", "Strong chemical / sulfur smell", "Continuous heavy bursts", "verified", 88.5, 14, "rep_hash_9281a"),
        ("REP_002", now_iso, 28.6500, 77.3140, "DEL_ANAND_VIHAR", "Dense Smoke", "Pungent smog layer trapped near ground level, stinging eyes and heavy throat irritation.", "< 100m", "Heavy burning smell", "Intermittent bursts", "verified", 92.0, 19, "rep_hash_1184b"),
        ("REP_003", now_iso, 28.6750, 77.1350, "DEL_PUNJABI_BAGH", "Burning Smell", "Noticeable smoke smell mixed with plastic and cracker residue around Club Road Punjabi Bagh.", "< 500m", "Moderate sulfur smell", "Moderate activity", "verified", 78.0, 8, "rep_hash_5521c"),
        ("REP_004", now_iso, 28.5645, 77.1890, "DEL_RK_PURAM", "Low Visibility", "Hazy horizon with street lights barely visible across Sector 4 R.K. Puram.", "< 200m", "Mild smoke smell", "Low background activity", "verified", 81.5, 11, "rep_hash_7740d"),
        ("REP_005", now_iso, 28.5930, 77.2290, "DEL_LODHI_ROAD", "Dust & Smoke", "Ground dust and smoke suspension near Lodhi Gardens boundary.", "< 500m", "Faint smoke smell", "No active bursting", "verified", 75.0, 6, "rep_hash_3391e")
    ]
    cur = conn.cursor()
    cur.executemany("""
    INSERT INTO community_reports (
        id, timestamp, latitude, longitude, neighbourhood_id, category,
        description, visibility_level, smell_intensity, cracker_activity,
        status, reliability_score, upvotes, reporter_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, reports)

def get_system_summary(db_path: Optional[Path] = None) -> Dict[str, Any]:
    conn = get_connection(db_path)
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM observations")
        obs_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM stations WHERE is_active = 1")
        stations_count = cur.fetchone()[0]

        cur.execute("SELECT MAX(timestamp) FROM observations")
        last_obs = cur.fetchone()[0]

        cur.execute("SELECT MAX(trained_at) FROM model_runs")
        last_model = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM community_reports")
        reports_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM road_corridors")
        corridors_count = cur.fetchone()[0]

        return {
            "total_observations": obs_count,
            "active_stations_count": stations_count,
            "last_observation_timestamp": last_obs,
            "last_model_trained_timestamp": last_model,
            "total_community_reports": reports_count,
            "active_road_corridors": corridors_count,
            "database_connected": True,
            "is_online": True,
            "offline_mode": True,
            "active_model": "Hybrid Ensemble (XGBoost + Random Forest + Residual Baseline)"
        }
    finally:
        conn.close()
