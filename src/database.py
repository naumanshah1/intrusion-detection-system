from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timedelta

DATABASE_URL = "sqlite:///./ids.db"

engine = create_engine(DATABASE_URL)
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
    attack_category = Column(String, nullable=True)
    status = Column(String, default="unlinked")  # unlinked, linked, acknowledged, false_positive
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
    timestamp = Column(DateTime, default=datetime.utcnow)

# Feature 1: Incidents (Grouping Alerts)
class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
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


# ========== TEST DATA GENERATION ==========

def generate_test_data():
    """Generate default user, 30 test alerts, and group them into incidents"""
    from datetime import timedelta
    import random
    import hashlib
    
    db = SessionLocal()
    
    # Check if test user already exists
    test_user = db.query(User).filter(User.username == "analyst").first()
    if not test_user:
        # Create default analyst user
        hashed_pwd = hashlib.sha256("analyst123".encode()).hexdigest()
        test_user = User(
            username="analyst",
            password=hashed_pwd,
            role="analyst"
        )
        db.add(test_user)
        db.commit()
        print("✓ Created default analyst user (analyst / analyst123)")
    
    # Check if data already exists
    existing_alerts = db.query(Alert).count()
    if existing_alerts > 0:
        print("✓ Test data already exists, skipping generation")
        db.close()
        return
    
    print("🔧 Generating test data...")
    
    # Test IPs and attack patterns
    attack_ips = ["192.168.1.100", "10.0.0.50", "172.16.0.25", "203.0.113.45", "198.51.100.10"]
    attack_categories = ["DoS", "Probe", "R2L", "U2R", "DoS", "Probe"]
    severities = ["low", "medium", "high", "critical"]
    
    # Create 30 test alerts
    alerts_data = []
    for i in range(30):
        # Create some alerts with same IP/category to test grouping
        ip_idx = i % len(attack_ips)
        cat_idx = i % len(attack_categories)
        sev_idx = i % len(severities)
        
        alert = Alert(
            type="Intrusion Detected",
            severity=severities[sev_idx],
            source_ip=attack_ips[ip_idx],
            attack_category=attack_categories[cat_idx],
            status="unlinked",
            timestamp=datetime.utcnow() - timedelta(minutes=random.randint(0, 60))
        )
        db.add(alert)
        alerts_data.append({
            "ip": attack_ips[ip_idx],
            "category": attack_categories[cat_idx],
            "severity": severities[sev_idx],
            "alert_obj": alert
        })
    
    db.flush()  # Get IDs
    print(f"✓ Created {len(alerts_data)} alerts")
    
    # Now group alerts into incidents based on IP + category + time window
    incidents_created = 0
    grouped_alerts = {}
    
    for alert_data in alerts_data:
        key = (alert_data["ip"], alert_data["category"])
        if key not in grouped_alerts:
            grouped_alerts[key] = []
        grouped_alerts[key].append(alert_data)
    
    # Create incidents and link alerts
    for (source_ip, attack_type), alert_list in grouped_alerts.items():
        incident = Incident(
            title=f"Attack from {source_ip}",
            description=f"Multiple {attack_type} attacks detected",
            severity=max(a["severity"] for a in alert_list),
            source_ips=source_ip,
            attack_type=attack_type,
            status="open",
            alert_count=len(alert_list),
            created_at=datetime.utcnow() - timedelta(minutes=random.randint(5, 30))
        )
        db.add(incident)
        db.flush()
        
        # Link alerts to incident
        for alert_data in alert_list:
            alert_data["alert_obj"].incident_id = incident.id
            alert_data["alert_obj"].status = "linked"
        
        incidents_created += 1
    
    db.commit()
    print(f"✓ Created {incidents_created} incidents with {len(alerts_data)} linked alerts")
    print("✓ Test data generation complete!")
    db.close()