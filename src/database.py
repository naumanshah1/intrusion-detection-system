from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timedelta
import sqlite3

DATABASE_URL = "sqlite:///./ids.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30},
)
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="user")  # admin / analyst / user

class LoginHistory(Base):
    __tablename__ = "login_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    success = Column(String)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String)
    status = Column(String, default="unread")
    timestamp = Column(DateTime, default=datetime.utcnow)

class Config(Base):
    __tablename__ = "config"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String)
    action = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    prediction = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    type = Column(String)
    severity = Column(String)
    source_ip = Column(String, nullable=True)
    destination_ip = Column(String, nullable=True)
    attack_category = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    status = Column(String, default="unlinked")  # unlinked, linked, acknowledged, false_positive
    raw_features = Column(String, nullable=True)  # JSON string of 41 NSL-KDD features
    timestamp = Column(DateTime, default=datetime.utcnow)

class Rule(Base):
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, index=True)
    field = Column(String)
    operator = Column(String)
    value = Column(String)
    priority = Column(Integer, default=0)
    automation = Column(String, default="manual")  # manual / auto
    simulated_blocks = Column(Integer, default=0)
    type = Column(String, default="block")
    source_ip = Column(String, nullable=True)
    enabled = Column(String, default="true")
    timestamp = Column(DateTime, default=datetime.utcnow)

# Feature 1: Incidents (Grouping Alerts)
class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String, nullable=True)
    title = Column(String)
    description = Column(String)
    status = Column(String, default="Open")  # Open, Investigating, Contained, Resolved
    severity = Column(String)  # Low, Medium, High, Critical
    source_ips = Column(String)  # comma-separated IPs
    attack_type = Column(String)  # ddos, bruteforce, malware, etc.
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    alert_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(String, default="")

class IncidentComment(Base):
    __tablename__ = "incident_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    analyst = Column(String)
    comment = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Whitelist(Base):
    __tablename__ = "whitelist"
    
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, index=True)
    reason = Column(String)
    created_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

# Feature 3: MLOps - Model Versions
class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)  # hybrid, rf, lr
    version = Column(String)
    accuracy = Column(String)
    trained_date = Column(DateTime)
    dataset_size = Column(Integer)
    deployed = Column(String, default="false")
    drift_detected = Column(String, default="false")
    created_at = Column(DateTime, default=datetime.utcnow)

# Feature 4: Analytics - KPI Tracking
class KPI(Base):
    __tablename__ = "kpis"

    id = Column(Integer, primary_key=True, index=True)
    metric_name = Column(String)
    value = Column(String)
    date = Column(DateTime, default=datetime.utcnow)

# Feature 5: Intelligence - Threat Score & Enrichment
class ThreatScore(Base):
    __tablename__ = "threat_scores"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, index=True)
    score = Column(Integer)  # 0-100
    label = Column(String)  # known_attacker, botnet, suspicious, clean
    enrichment = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow)

# Feature 10: Notification System
class NotificationConfig(Base):
    __tablename__ = "notification_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    channel = Column(String)  # email, slack, in-app
    threshold = Column(Integer)  # e.g., notify if > 5 critical alerts
    enabled = Column(String, default="true")
    created_at = Column(DateTime, default=datetime.utcnow)

# Feature 11: Real-Time Pipeline Status
class PipelineStatus(Base):
    __tablename__ = "pipeline_status"

    id = Column(Integer, primary_key=True, index=True)
    component = Column(String)  # kafka, processor, db
    status = Column(String)  # healthy, degraded, down
    packets_per_sec = Column(Integer)
    latency_ms = Column(Integer)
    last_update = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)


def ensure_schema_compatibility():
    """Apply lightweight SQLite migrations for columns used by real-time streaming."""
    conn = sqlite3.connect("ids.db")
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL")
    cur.execute("PRAGMA synchronous=NORMAL")

    def add_column_if_missing(table_name, column_name, column_sql):
        cur.execute(f"PRAGMA table_info({table_name})")
        existing = {row[1] for row in cur.fetchall()}
        if column_name not in existing:
            cur.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_sql}")

    add_column_if_missing("alerts", "destination_ip", "TEXT")
    add_column_if_missing("alerts", "confidence", "REAL")
    add_column_if_missing("alerts", "raw_features", "TEXT")
    add_column_if_missing("rules", "type", "TEXT DEFAULT 'block'")
    add_column_if_missing("rules", "source_ip", "TEXT")
    add_column_if_missing("rules", "enabled", "TEXT DEFAULT 'true'")
    add_column_if_missing("incidents", "incident_id", "TEXT")

    cur.execute("CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_alerts_incident_id ON alerts(incident_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at)")

    conn.commit()
    conn.close()


ensure_schema_compatibility()


# ========== TEST DATA GENERATION ==========

def generate_test_data():
    """Keep bootstrap minimal: only ensure a default analyst user exists."""
    import hashlib

    db = SessionLocal()
    test_user = db.query(User).filter(User.username == "analyst").first()
    if not test_user:
        hashed_pwd = hashlib.sha256("analyst123".encode()).hexdigest()
        db.add(User(username="analyst", password=hashed_pwd, role="analyst"))
        db.commit()
        print("✓ Created default analyst user (analyst / analyst123)")
    db.close()
    return

