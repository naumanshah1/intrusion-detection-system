from fastapi import FastAPI, Depends, HTTPException, WebSocket, UploadFile, File
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import joblib
import os
import io
import pandas as pd
import numpy as np
import asyncio
import json
import time
import traceback
from datetime import datetime, timedelta
from collections import deque
from sqlalchemy import func
from sqlalchemy import text

# Kafka support (if kafka-python provided)
try:
    from kafka import KafkaProducer, KafkaConsumer
    kafka_available = True
except ImportError:
    kafka_available = False

from src.preprocessing import load_data, preprocess_single
from src.hybrid_model import hybrid_predict
from src.thresholds import compute_thresholds
from src.database import SessionLocal, Log, User, Alert, Rule, Notification, Config, AuditLog, APIKey, LoginHistory, Incident, ModelVersion, KPI, ThreatScore, NotificationConfig, PipelineStatus, IncidentComment, Whitelist, generate_test_data
from src.auth import hash_password, verify_password, create_token, decode_token
from src.rules import apply_rules
from src.realtime_engine import RealtimeIDSEngine
import secrets

app = FastAPI(title="Intrusion Detection API")

# Global model tracking
current_model = "hybrid"

# Global system status / console log buffer
model_status = {"loaded": False, "model_name": "", "error": None}
console_log_buffer = deque(maxlen=500)

def emit_console(level, source, message):
    """Push a log line into the shared console buffer"""
    ts = datetime.utcnow().strftime("%H:%M:%S.%f")[:-3]
    entry = {"timestamp": ts, "level": level, "source": source, "message": message}
    console_log_buffer.appendleft(entry)

# Enable CORS for frontend - MUST be before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# CORS preflight handlers
@app.options("/signup")
def signup_options():
    from fastapi.responses import Response
    response = Response()
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.options("/login")
def login_options():
    from fastapi.responses import Response
    response = Response()
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response
# Load models + preprocessing
# -----------------------------
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_dir = os.path.join(base_dir, "models")

try:
    rf = joblib.load(os.path.join(model_dir, "rf.pkl"))
    encoders = joblib.load(os.path.join(model_dir, "encoders.pkl"))
    scaler = joblib.load(os.path.join(model_dir, "scaler.pkl"))
    features = joblib.load(os.path.join(model_dir, "features.pkl"))
    iso_model = joblib.load(os.path.join(model_dir, "iso.pkl")) if os.path.exists(os.path.join(model_dir, "iso.pkl")) else None
    lr_model = joblib.load(os.path.join(model_dir, "lr.pkl")) if os.path.exists(os.path.join(model_dir, "lr.pkl")) else None
    model_status["loaded"] = True
    model_status["model_name"] = "RandomForest"
    model_status["optional_models"] = {
        "iso": iso_model is not None,
        "lr": lr_model is not None,
    }
    emit_console("INFO", "ML-ENGINE", f"Model RandomForest loaded — {len(features)} features")
except Exception as e:
    rf = None
    iso_model = None
    lr_model = None
    encoders = None
    scaler = None
    features = None
    model_status["loaded"] = False
    model_status["error"] = str(e)
    emit_console("ALERT", "ML-ENGINE", f"FAILED to load model: {e}")

# -----------------------------
# Auth Helper Functions
# -----------------------------
def log_audit(user: str, action: str):
    db = SessionLocal()
    db.add(AuditLog(user=user, action=action))
    db.commit()
    db.close()

# Real-time stream engine
realtime_engine = RealtimeIDSEngine(rf, encoders, scaler, features, emit_console) if model_status["loaded"] else None


# ========== STARTUP EVENT ==========
@app.on_event("startup")
async def startup_event():
    """Initialize baseline data and start real-time IDS stream."""
    print("\n🚀 IDS Sentinel API Starting...\n")
    try:
        generate_test_data()
        if realtime_engine:
            realtime_engine.start()
            emit_console("INFO", "PIPELINE", "Real-time IDS stream started")
        print("✅ API Ready!\n")
    except Exception as e:
        print(f"⚠️ Startup warning: {str(e)}\n")


def get_current_user(credentials = Depends(security)):
    """Extract and verify JWT token from request"""
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    username = payload["sub"]
    db = SessionLocal()
    user_obj = db.query(User).filter(User.username == username).first()
    if not user_obj:
        db.close()
        raise HTTPException(status_code=401, detail="User not found")

    user_info = {"id": user_obj.id, "username": user_obj.username, "role": user_obj.role}
    db.close()
    return user_info


def require_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user


# ========== SOC INCIDENT GROUPING LOGIC ==========

def auto_group_alert_to_incident(db, alert: Alert):
    """Auto-group alert into incident based on source IP, attack type, and time window"""
    from datetime import timedelta
    
    if not alert.source_ip:
        return None
    
    # Look for matching incident created within 10 minutes
    time_window = datetime.utcnow() - timedelta(minutes=10)
    
    # Use SQLite compatible contains with LIKE operator
    matching_incident = db.query(Incident).filter(
        Incident.source_ips.like(f"%{alert.source_ip}%"),
        Incident.attack_type == alert.attack_category,
        Incident.created_at >= time_window,
        Incident.status.in_(["open", "investigating"])  # lowercase status
    ).first()
    
    if matching_incident:
        # Link alert to incident
        alert.incident_id = matching_incident.id
        alert.status = "linked"
        matching_incident.updated_at = datetime.utcnow()
        db.commit()
        return matching_incident.id
    
    return None

# -----------------------------
# Auth Routes
# -----------------------------
@app.post("/signup")
def signup(user: dict):
    """Register a new user"""
    try:
        print(f"Signup attempt for user: {user.get('username', 'unknown')}")
        db = SessionLocal()
        print("Database session created")

        # Check if user already exists
        existing_user = db.query(User).filter(User.username == user["username"]).first()
        print(f"User exists check: {existing_user is not None}")
        if existing_user:
            db.close()
            raise HTTPException(status_code=400, detail="User already exists")

        print("Hashing password...")
        # Try simpler hashing first
        import hashlib
        hashed_password = hashlib.sha256(user["password"].encode()).hexdigest()
        print("Password hashed with sha256")

        # Create new user
        role = user.get("role", "user")
        new_user = User(
            username=user["username"],
            password=hashed_password,
            role=role
        )
        print("User object created")

        db.add(new_user)
        print("User added to session")
        db.commit()
        print("Database committed")

        # Log signup audit
        log_audit(new_user.username, "signup")

        # Create token for immediate login
        token = create_token({"sub": new_user.username, "role": role})
        print("Token created")

        db.close()
        print("Database session closed")

        return {"access_token": token, "token_type": "bearer", "message": "User created successfully", "role": role}
    except Exception as e:
        # Log the actual error for debugging
        print(f"Signup error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/login")
def login(credentials: dict):
    """Authenticate user and return JWT token"""
    db = None
    try:
        db = SessionLocal()
        
        # Find user
        db_user = db.query(User).filter(User.username == credentials["username"]).first()
        
        if not db_user:
            db.close()
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Simple password verification
        import hashlib
        hashed_input = hashlib.sha256(credentials["password"].encode()).hexdigest()
        
        if hashed_input != db_user.password:
            db.close()
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create token
        token = create_token({"sub": db_user.username, "role": db_user.role})

        # Login History
        db.add(LoginHistory(user_id=db_user.id, success="true"))
        db.commit()

        # Audit log
        log_audit(db_user.username, "login")

        db.close()
        return {"access_token": token, "token_type": "bearer", "role": db_user.role}
    except HTTPException:
        if db:
            db.close()
        raise
    except Exception as e:
        if db:
            db.close()
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/test-db")
def test_db():
    """Test database connection and table creation"""
    try:
        db = SessionLocal()
        # Try to query users table
        users = db.query(User).all()
        db.close()
        return {"status": "success", "users_count": len(users)}
    except Exception as e:
        return {"status": "error", "message": str(e)}
@app.get("/")
def home():
    return {"message": "IDS API Running 🚀"}

@app.get("/test-data")
def test_data():
    """Quick test endpoint to verify data generation (no auth required)"""
    db = SessionLocal()
    alerts_count = db.query(Alert).count()
    incidents_count = db.query(Incident).count()
    users_count = db.query(User).count()
    db.close()
    
    return {
        "status": "ok",
        "alerts": alerts_count,
        "incidents": incidents_count,
        "users": users_count,
        "message": "Data generation complete" if alerts_count > 0 else "No data yet"
    }

@app.post("/predict")
def predict(sample: dict, username: str = Depends(get_current_user)):
    """Predict if traffic is attack or normal (protected route)"""
    db = None
    try:
        # Load thresholds here instead of module level
        df = load_data()
        thresholds = compute_thresholds(df)
        
        # Get user from DB
        db = SessionLocal()
        user = db.query(User).filter(User.username == username['username']).first()
        
        # Check custom rules first (Phase 2)
        rules = db.query(Rule).all()
        if rules and apply_rules(sample, rules) == 1:
            pred = 1
            label = "attack"
        else:
            # Convert input → DataFrame
            sample_df = pd.DataFrame([sample])

            # Preprocess
            sample_array = preprocess_single(
                sample_df, encoders, scaler, features
            )[0]

            # Use selected model (Phase 2)
            if current_model == "hybrid":
                pred = hybrid_predict(sample, sample_array, rf, thresholds)
            elif current_model == "rf":
                pred = rf.predict([sample_array])[0]
            elif current_model == "lr":
                pred = lr.predict([sample_array])[0] if hasattr(locals(), 'lr') else hybrid_predict(sample, sample_array, rf, thresholds)
            else:
                pred = hybrid_predict(sample, sample_array, rf, thresholds)
            
            label = "attack" if pred == 1 else "normal"

        # Save log
        log = Log(user_id=user.id if user else None, prediction=label)
        db.add(log)

        # Create alert if attack detected
        if label == "attack":
            source_ip = sample.get("src_ip", "unknown")
            # Determine attack category from sample fields
            attack_category = sample.get("protocol_type", "unknown")
            if sample.get("dst_port") in [22, 23]:
                attack_category = "R2L"
            elif sample.get("src_bytes", 0) > 5000 or sample.get("dst_bytes", 0) > 5000:
                attack_category = "DoS"
            
            severity = "critical" if sample.get("num_failed_logins", 0) > 5 else "high"
            
            alert = Alert(
                type="Intrusion Detected",
                severity=severity,
                source_ip=source_ip,
                attack_category=attack_category,
                status="unlinked"
            )
            db.add(alert)
            db.flush()  # Get alert ID
            
            # Auto-group into incident
            incident_id = auto_group_alert_to_incident(db, alert)
            
            if not incident_id:
                # Create new incident if no match found
                incident = Incident(
                    title=f"Attack from {source_ip}",
                    description=f"Attack type: {attack_category}",
                    severity=severity,
                    source_ips=source_ip,
                    attack_type=attack_category,
                    status="open",  # lowercase
                    alert_count=1
                )
                db.add(incident)
                db.flush()
                alert.incident_id = incident.id
                alert.status = "linked"
            
            db.add(Notification(message=f"Attack detected from {source_ip}", status="unread"))

        # Audit event for prediction
        log_audit(username['username'], f"predict:{label}")

        db.commit()
        db.close()

        return {"prediction": label}

    except Exception as e:
        if db:
            db.close()
        return {
            "error": str(e),
            "message": "Invalid input format"
        }

@app.get("/alerts")
def get_alerts(username: str = Depends(get_current_user), status: str = None, severity: str = None, linked: str = None, limit: int = 200):
    """Get alerts with filtering (protected route)"""
    db = SessionLocal()
    
    query = db.query(Alert).order_by(Alert.timestamp.desc())
    
    # Filter by linked status
    if linked == "linked":
        query = query.filter(Alert.incident_id != None)
    elif linked == "unlinked":
        query = query.filter(Alert.incident_id == None)
    
    # Filter by severity
    if severity:
        query = query.filter(Alert.severity == severity)
    
    # Filter by status
    if status:
        query = query.filter(Alert.status == status)
    
    safe_limit = max(1, min(limit, 500))
    alerts = query.limit(safe_limit).all()
    db.close()
    
    alerts_list = [
        {
            "id": str(a.id),
            "type": a.type,
            "severity": a.severity,
            "source_ip": a.source_ip,
            "destination_ip": a.destination_ip,
            "attack_category": a.attack_category,
            "category": a.attack_category,
            "confidence": a.confidence,
            "status": a.status,
            "incident_id": str(a.incident_id) if a.incident_id else None,
            "timestamp": a.timestamp.isoformat()
        }
        for a in alerts
    ]
    
    return {"alerts": alerts_list}


@app.get("/alerts/{alert_id}")
def get_alert_detail(alert_id: int, user=Depends(get_current_user)):
    """Get full alert detail with 41 features for Investigation page"""
    db = SessionLocal()
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        db.close()
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Parse stored raw features JSON
    raw_features = {}
    if alert.raw_features:
        try:
            raw_features = json.loads(alert.raw_features)
        except Exception:
            pass
    
    result = {
        "id": str(alert.id),
        "type": alert.type,
        "severity": alert.severity,
        "source_ip": alert.source_ip,
        "destination_ip": alert.destination_ip,
        "attack_category": alert.attack_category,
        "category": alert.attack_category,
        "confidence": alert.confidence,
        "status": alert.status,
        "incident_id": str(alert.incident_id) if alert.incident_id else None,
        "timestamp": alert.timestamp.isoformat(),
        "features": raw_features
    }
    db.close()
    return result

@app.get("/logs")
def get_logs(username: str = Depends(get_current_user)):
    """Get all logs (protected route)"""
    db = SessionLocal()
    logs = db.query(Log).order_by(Log.timestamp.desc()).all()
    db.close()
    
    return [{"id": l.id, "prediction": l.prediction, "timestamp": l.timestamp.isoformat()} for l in logs]

@app.get("/analytics")
def analytics(username: str = Depends(get_current_user)):
    """Get analytics data (protected route)"""
    db = SessionLocal()
    
    total = db.query(Log).count()
    attacks = db.query(Log).filter(Log.prediction == "attack").count()
    normal = db.query(Log).filter(Log.prediction == "normal").count()
    
    db.close()
    
    return {
        "total": total,
        "attacks": attacks,
        "normal": normal
    }

@app.get("/notifications")
def get_notifications(username: str = Depends(get_current_user)):
    db = SessionLocal()
    notes = db.query(Notification).order_by(Notification.timestamp.desc()).all()
    db.close()
    return [{"id": n.id, "message": n.message, "status": n.status, "timestamp": n.timestamp.isoformat()} for n in notes]

@app.post("/notifications/read/{note_id}")
def read_notification(note_id: int, username: str = Depends(get_current_user)):
    db = SessionLocal()
    note = db.query(Notification).filter(Notification.id == note_id).first()
    if not note:
        db.close()
        raise HTTPException(status_code=404, detail="Notification not found")
    note.status = "read"
    db.commit()
    db.close()
    return {"message": "Notification marked as read"}

@app.get("/config")
def get_config(user=Depends(require_admin)):
    db = SessionLocal()
    cfg = db.query(Config).all()
    db.close()
    return [{"key": c.key, "value": c.value, "updated_at": c.updated_at.isoformat()} for c in cfg]

@app.post("/config")
def update_config(payload: dict, user=Depends(require_admin)):
    db = SessionLocal()
    key = payload.get("key")
    value = payload.get("value")
    if not key or value is None:
        db.close()
        raise HTTPException(status_code=400, detail="key and value are required")
    entry = db.query(Config).filter(Config.key == key).first()
    if entry:
        entry.value = str(value)
        entry.updated_at = datetime.utcnow()
    else:
        entry = Config(key=key, value=str(value))
        db.add(entry)
    db.commit()
    db.close()
    log_audit(user['username'], f"config:update:{key}")
    return {"message": "Config updated", "key": key, "value": value}

@app.get("/report")
def generate_report(username: str = Depends(get_current_user), period: str = "daily"):
    db = SessionLocal()
    # simple sample report
    attacks = db.query(Log).filter(Log.prediction == "attack").count()
    normal = db.query(Log).filter(Log.prediction == "normal").count()
    total = attacks + normal
    db.close()
    return {"period": period, "total": total, "attacks": attacks, "normal": normal}

@app.get("/audit-logs")
def get_audit_logs(user=Depends(require_admin)):
    db = SessionLocal()
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(200).all()
    db.close()
    return [{"id": l.id, "user": l.user, "action": l.action, "timestamp": l.timestamp.isoformat()} for l in logs]

@app.post("/api-keys")
def create_api_key(user=Depends(require_admin)):
    db = SessionLocal()
    token = secrets.token_urlsafe(32)
    api_key = APIKey(key=token, user_id=user['id'])
    db.add(api_key)
    db.commit()
    db.close()
    log_audit(user['username'], "create_api_key")
    return {"api_key": token}

@app.get("/api-keys")
def list_api_keys(user=Depends(require_admin)):
    db = SessionLocal()
    keys = db.query(APIKey).filter(APIKey.user_id == user['id']).all()
    db.close()
    return [{"id": k.id, "key": k.key, "created_at": k.created_at.isoformat()} for k in keys]

@app.delete("/api-keys/{key_id}")
def revoke_api_key(key_id: int, user=Depends(require_admin)):
    db = SessionLocal()
    key = db.query(APIKey).filter(APIKey.id == key_id, APIKey.user_id == user['id']).first()
    if not key:
        db.close()
        raise HTTPException(status_code=404, detail="API key not found")
    db.delete(key)
    db.commit()
    db.close()
    log_audit(user['username'], "revoke_api_key")
    return {"message": "API key revoked"}


@app.post("/verify-api-key")
def verify_api_key(payload: dict):
    token = payload.get("key")
    if not token:
        raise HTTPException(status_code=400, detail="API key required")
    db = SessionLocal()
    key = db.query(APIKey).filter(APIKey.key == token).first()
    db.close()
    if not key:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return {"valid": True, "user_id": key.user_id}


@app.post("/kafka/publish")
def kafka_publish(payload: dict, username: str = Depends(get_current_user)):
    if not kafka_available:
        raise HTTPException(status_code=501, detail="Kafka not available in environment")

    topic = payload.get("topic", "network-traffic")
    message = payload.get("message")
    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    producer = KafkaProducer(bootstrap_servers='localhost:9092', value_serializer=lambda v: json.dumps(v).encode('utf-8'))
    producer.send(topic, {"user": username, "payload": message})
    producer.flush()
    producer.close()

    log_audit(username['username'], f"kafka_publish:{topic}")
    return {"status": "published", "topic": topic}


@app.get("/kafka/consume")
def kafka_consume(username: str = Depends(get_current_user)):
    if not kafka_available:
        raise HTTPException(status_code=501, detail="Kafka not available in environment")

    consumer = KafkaConsumer('network-traffic', bootstrap_servers='localhost:9092', auto_offset_reset='earliest', enable_auto_commit=True, group_id='ids-group')
    messages = []
    results = []
    
    for m in consumer.poll(timeout_ms=1000).values():
        for rec in m:
            try:
                data = json.loads(rec.value.decode('utf-8'))
                messages.append(data)
                
                # Flow: Consumer -> Model -> DB
                if "payload" in data:
                    res = predict(data["payload"], username)
                    results.append(res)
            except Exception as e:
                messages.append({'raw': str(rec.value), 'error': str(e)})
    consumer.close()

    return {"messages_processed": len(messages), "predictions": results}


@app.get("/logs")
def get_logs(username: str = Depends(get_current_user)):
    """Get logs for current user (protected route)"""
    db = SessionLocal()
    
    user = db.query(User).filter(User.username == username).first()
    logs = db.query(Log).filter(Log.user_id == user.id).all()
    
    db.close()

    return [
        {"id": log.id, "prediction": log.prediction}
        for log in logs
    ]

# ========== PHASE 2: RULES ENGINE ==========

@app.post("/add-rule")
def add_rule(field: str, operator: str, value: str):
    """Add a custom detection rule"""
    db = SessionLocal()
    
    rule = Rule(field=field, operator=operator, value=value)
    db.add(rule)
    db.commit()
    
    rule_id = rule.id
    db.close()
    
    return {"id": rule_id, "message": "Rule added successfully"}

@app.get("/rules")
def get_rules():
    """Get all custom rules"""
    db = SessionLocal()
    rules = db.query(Rule).order_by(Rule.timestamp.desc()).all()
    db.close()

    return [
        {
            "id": r.id,
            "field": r.field,
            "operator": r.operator,
            "value": r.value,
            "priority": r.priority,
            "automation": r.automation,
            "simulated_blocks": r.simulated_blocks,
            "type": r.type or ("block" if r.automation == "auto" else "allow"),
            "source_ip": r.source_ip or (r.value if r.field == "src_ip" else None),
            "enabled": (r.enabled or "true").lower() == "true",
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
        }
        for r in rules
    ]

@app.delete("/delete-rule/{rule_id}")
def delete_rule(rule_id: int):
    """Delete a rule by ID"""
    db = SessionLocal()
    
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        db.close()
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db.delete(rule)
    db.commit()
    db.close()
    
    return {"message": "Rule deleted successfully"}

# ========== PHASE 2: MODEL MANAGEMENT ==========

@app.post("/set-model")
def set_model(model_name: str):
    """Switch to a different model"""
    global current_model
    
    valid_models = ["hybrid", "rf", "lr"]
    if model_name not in valid_models:
        raise HTTPException(status_code=400, detail=f"Invalid model. Choose from {valid_models}")
    
    current_model = model_name
    return {"current_model": current_model, "message": f"Switched to {model_name}"}

@app.get("/models")
def get_models():
    """Get list of available models"""
    return {
        "available": ["hybrid", "rf", "lr"],
        "current": current_model
    }

# ========== PHASE 2: DATA EXPLORER ==========

@app.get("/logs-filter")
def filter_logs(prediction: str = None, limit: int = 100):
    """Filter logs by prediction type"""
    db = SessionLocal()
    
    query = db.query(Log)
    
    if prediction:
        if prediction not in ["attack", "normal"]:
            db.close()
            raise HTTPException(status_code=400, detail="Prediction must be 'attack' or 'normal'")
        query = query.filter(Log.prediction == prediction)
    
    logs = query.order_by(Log.timestamp.desc()).limit(limit).all()
    db.close()
    
    return [
        {
            "id": log.id,
            "prediction": log.prediction,
            "timestamp": log.timestamp.isoformat()
        }
        for log in logs
    ]

# ========== PHASE 2: REAL-TIME CONSOLE (WebSocket) ==========

active_connections = []

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """WebSocket endpoint for real-time log streaming"""
    await ws.accept()
    active_connections.append(ws)
    
    try:
        db = SessionLocal()
        last_id = 0
        
        while True:
            # Fetch new logs
            new_logs = db.query(Log).filter(Log.id > last_id).order_by(Log.id.desc()).limit(10).all()
            
            if new_logs:
                last_id = new_logs[0].id
                data = [
                    {
                        "id": log.id,
                        "prediction": log.prediction,
                        "timestamp": log.timestamp.isoformat()
                    }
                    for log in reversed(new_logs)
                ]
                await ws.send_json({"type": "logs", "data": data})
            
            # Send heartbeat every 2 seconds
            await asyncio.sleep(2)
    
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        active_connections.remove(ws)
        db.close()


# ========== FEATURE 1: INCIDENTS (Group Alerts) ==========

@app.post("/incidents")
def create_incident(payload: dict, user=Depends(get_current_user)):
    db = SessionLocal()
    incident = Incident(
        title=payload.get("title"),
        description=payload.get("description"),
        severity=payload.get("severity", "medium").lower(),
        source_ips=payload.get("source_ips"),
        attack_type=payload.get("attack_type"),
        status="open",  # Default status
        assigned_to=user.get('id'),
        alert_count=1
    )
    db.add(incident)
    db.commit()
    
    # Link any unlinked alerts with same IP/type
    source_ip = payload.get("source_ips")
    attack_type = payload.get("attack_type")
    if source_ip and attack_type:
        unlinked_alerts = db.query(Alert).filter(
            Alert.source_ip == source_ip,
            Alert.attack_category == attack_type,
            Alert.incident_id == None
        ).all()
        for alert in unlinked_alerts:
            alert.incident_id = incident.id
            alert.status = "linked"
            incident.alert_count += 1
        db.commit()
    
    db.close()
    log_audit(user['username'], f"create_incident:{incident.id}")
    return {"id": incident.id, "status": incident.status, "message": "Incident created"}

@app.get("/incidents")
def get_incidents(user=Depends(get_current_user), limit: int = 300):
    db = SessionLocal()
    safe_limit = max(1, min(limit, 1000))
    incidents = db.query(Incident).order_by(Incident.created_at.desc()).limit(safe_limit).all()
    db.close()
    
    # Calculate duration
    return [
        {
            "id": str(i.id),
            "title": i.title,
            "status": i.status,
            "severity": i.severity,
            "source_ips": i.source_ips,
            "attack_type": i.attack_type,
            "alert_count": i.alert_count,
            "assigned_to": i.assigned_to,
            "created_at": i.created_at.isoformat(),
            "updated_at": i.updated_at.isoformat(),
            "duration_minutes": int((i.updated_at - i.created_at).total_seconds() / 60)
        }
        for i in incidents
    ]

@app.get("/incidents/{incident_id}")
def get_incident_details(incident_id: int, user=Depends(get_current_user)):
    db = SessionLocal()
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        db.close()
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Get linked alerts
    alerts = db.query(Alert).filter(Alert.incident_id == incident_id).order_by(Alert.timestamp.desc()).all()
    
    # Get comments
    comments = db.query(IncidentComment).filter(IncidentComment.incident_id == incident_id).order_by(IncidentComment.created_at.desc()).all()
    
    db.close()
    
    return {
        "id": str(incident.id),
        "title": incident.title,
        "description": incident.description,
        "status": incident.status,
        "severity": incident.severity,
        "source_ips": incident.source_ips,
        "attack_type": incident.attack_type,
        "alert_count": incident.alert_count,
        "assigned_to": incident.assigned_to,
        "notes": incident.notes,
        "created_at": incident.created_at.isoformat(),
        "updated_at": incident.updated_at.isoformat(),
        "duration_minutes": int((incident.updated_at - incident.created_at).total_seconds() / 60),
        "linked_alerts": [
            {
                "id": str(a.id),
                "type": a.type,
                "severity": a.severity.lower(),
                "source_ip": a.source_ip,
                "attack_category": a.attack_category,
                "timestamp": a.timestamp.isoformat()
            }
            for a in alerts
        ],
        "comments": [
            {
                "id": c.id,
                "created_by": c.analyst,  # Map analyst → created_by
                "content": c.comment,     # Map comment → content
                "created_at": c.created_at.isoformat()
            }
            for c in comments
        ]
    }

@app.put("/incidents/{incident_id}")
def update_incident(incident_id: int, payload: dict, user=Depends(get_current_user)):
    db = SessionLocal()
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        db.close()
        raise HTTPException(status_code=404, detail="Incident not found")
    
    incident.status = payload.get("status", incident.status)
    incident.severity = payload.get("severity", incident.severity)
    incident.assigned_to = payload.get("assigned_to", incident.assigned_to)
    incident.notes = payload.get("notes", incident.notes)
    incident.updated_at = datetime.utcnow()
    updated_status = incident.status
    
    db.commit()
    db.close()
    
    log_audit(user['username'], f"update_incident:{incident_id}:status={updated_status}")
    return {"message": "Incident updated", "status": updated_status}

@app.post("/incidents/{incident_id}/comments")
def add_incident_comment(incident_id: int, payload: dict, user=Depends(get_current_user)):
    db = SessionLocal()
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        db.close()
        raise HTTPException(status_code=404, detail="Incident not found")
    
    comment = IncidentComment(
        incident_id=incident_id,
        analyst=user['username'],  # Stores analyst username
        comment=payload.get("content")  # Frontend sends 'content'
    )
    db.add(comment)
    incident.updated_at = datetime.utcnow()
    db.commit()
    db.close()
    
    log_audit(user['username'], f"add_comment:{incident_id}")
    return {"id": comment.id, "message": "Comment added"}

@app.post("/incidents/{incident_id}/block-ip")
def block_incident_source_ip(incident_id: int, user=Depends(require_admin)):
    db = SessionLocal()
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        db.close()
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Create rule to block source IP
    source_ip = incident.source_ips.split(",")[0] if incident.source_ips else None
    if source_ip:
        rule = Rule(
            field="src_ip",
            operator="==",
            value=source_ip,
            priority=100,
            automation="auto"
        )
        db.add(rule)
        db.commit()
        log_audit(user['username'], f"block_ip:{source_ip}:incident={incident_id}")
        db.close()
        return {"message": f"IP {source_ip} blocked", "rule_id": rule.id}
    
    db.close()
    raise HTTPException(status_code=400, detail="No source IP found")

@app.post("/incidents/{incident_id}/whitelist-ip")
def whitelist_incident_source_ip(incident_id: int, user=Depends(require_admin)):
    db = SessionLocal()
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        db.close()
        raise HTTPException(status_code=404, detail="Incident not found")
    
    source_ip = incident.source_ips.split(",")[0] if incident.source_ips else None
    if source_ip:
        whitelist = Whitelist(
            ip_address=source_ip,
            reason=f"Whitelisted from incident {incident_id}",
            created_by=user['username']
        )
        db.add(whitelist)
        db.commit()
        log_audit(user['username'], f"whitelist_ip:{source_ip}:incident={incident_id}")
        db.close()
        return {"message": f"IP {source_ip} whitelisted"}
    
    db.close()
    raise HTTPException(status_code=400, detail="No source IP found")

@app.post("/alerts/{alert_id}/link-incident")
def link_alert_to_incident(alert_id: int, payload: dict, user=Depends(get_current_user)):
    db = SessionLocal()
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        db.close()
        raise HTTPException(status_code=404, detail="Alert not found")
    
    incident_id = payload.get("incident_id")
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        db.close()
        raise HTTPException(status_code=404, detail="Incident not found")
    
    alert.incident_id = incident_id
    alert.status = "linked"
    incident.alert_count += 1
    db.commit()
    db.close()
    
    log_audit(user['username'], f"link_alert:{alert_id}:to_incident={incident_id}")
    return {"message": "Alert linked to incident"}

@app.get("/whitelist")
def get_whitelist(user=Depends(get_current_user)):
    db = SessionLocal()
    whitelist = db.query(Whitelist).order_by(Whitelist.created_at.desc()).all()
    db.close()
    
    return [
        {
            "id": w.id,
            "ip_address": w.ip_address,
            "reason": w.reason,
            "created_by": w.created_by,
            "created_at": w.created_at.isoformat()
        }
        for w in whitelist
    ]

@app.delete("/whitelist/{whitelist_id}")
def remove_whitelist(whitelist_id: int, user=Depends(require_admin)):
    db = SessionLocal()
    whitelist = db.query(Whitelist).filter(Whitelist.id == whitelist_id).first()
    if not whitelist:
        db.close()
        raise HTTPException(status_code=404, detail="Whitelist entry not found")
    
    ip = whitelist.ip_address
    db.delete(whitelist)
    db.commit()
    db.close()
    
    log_audit(user['username'], f"remove_whitelist:{ip}")
    return {"message": "Whitelist entry removed"}


# ========== FEATURE 3: MLOps - Model Management ==========

@app.post("/models/version")
def create_model_version(payload: dict, user=Depends(require_admin)):
    db = SessionLocal()
    version = ModelVersion(
        name=payload.get("name"),
        version=payload.get("version"),
        accuracy=payload.get("accuracy"),
        trained_date=datetime.utcnow(),
        dataset_size=payload.get("dataset_size", 0)
    )
    db.add(version)
    db.commit()
    db.close()
    log_audit(user['username'], f"create_model_version:{version.id}")
    return {"id": version.id, "message": "Model version created"}

@app.get("/models/versions")
def get_model_versions(user=Depends(get_current_user)):
    db = SessionLocal()
    versions = db.query(ModelVersion).order_by(ModelVersion.created_at.desc()).all()
    db.close()
    return [
        {
            "id": v.id,
            "name": v.name,
            "version": v.version,
            "accuracy": v.accuracy,
            "deployed": v.deployed,
            "drift_detected": v.drift_detected,
            "trained_date": v.trained_date.isoformat() if v.trained_date else None
        }
        for v in versions
    ]

@app.post("/models/deploy/{version_id}")
def deploy_model(version_id: int, user=Depends(require_admin)):
    db = SessionLocal()
    version = db.query(ModelVersion).filter(ModelVersion.id == version_id).first()
    if not version:
        db.close()
        raise HTTPException(status_code=404, detail="Model version not found")
    version.deployed = "true"
    db.commit()
    db.close()
    log_audit(user['username'], f"deploy_model:{version_id}")
    return {"message": f"Model {version.version} deployed"}

@app.post("/models/rollback/{version_id}")
def rollback_model(version_id: int, user=Depends(require_admin)):
    db = SessionLocal()
    version = db.query(ModelVersion).filter(ModelVersion.id == version_id).first()
    if not version:
        db.close()
        raise HTTPException(status_code=404, detail="Model version not found")
    version.deployed = "true"
    # Mark all others as not deployed
    db.query(ModelVersion).filter(ModelVersion.id != version_id).update({"deployed": "false"})
    db.commit()
    db.close()
    log_audit(user['username'], f"rollback_model:{version_id}")
    return {"message": f"Rolled back to {version.version}"}


# ========== FEATURE 4: Analytics KPIs ==========

@app.get("/kpis")
def get_kpis(user=Depends(get_current_user)):
    db = SessionLocal()
    total = db.query(Log).count()
    attacks = db.query(Log).filter(Log.prediction == "attack").count()
    
    dr = (attacks / total * 100) if total > 0 else 0
    fpr = 5.2  # simulated
    
    db.close()
    return {
        "detection_rate": f"{dr:.1f}%",
        "false_positive_rate": f"{fpr:.1f}%",
        "total_logs": total,
        "attacks_detected": attacks,
        "trend": "DoS attacks increased 23% this week"
    }


# ========== FEATURE 5: Intelligence - Threat Scores ==========

@app.post("/threat-scores")
def add_threat_score(payload: dict, user=Depends(require_admin)):
    db = SessionLocal()
    score = ThreatScore(
        ip_address=payload.get("ip_address"),
        score=payload.get("score"),
        label=payload.get("label"),
        enrichment=payload.get("enrichment")
    )
    db.add(score)
    db.commit()
    db.close()
    return {"id": score.id, "message": "Threat score added"}

@app.get("/threat-scores")
def get_threat_scores(user=Depends(get_current_user)):
    db = SessionLocal()
    scores = db.query(ThreatScore).all()
    db.close()
    return [
        {
            "id": s.id,
            "ip_address": s.ip_address,
            "score": s.score,
            "label": s.label,
            "enrichment": s.enrichment
        }
        for s in scores
    ]

@app.post("/block-ip")
def block_ip(payload: dict, user=Depends(require_admin)):
    db = SessionLocal()
    ip = payload.get("ip_address")
    rule = Rule(field="src_ip", operator="==", value=ip, priority=100, automation="auto")
    db.add(rule)
    db.commit()
    db.close()
    log_audit(user['username'], f"block_ip:{ip}")
    return {"message": f"IP {ip} blocked via rule"}


# ========== FEATURE 6: Auto-Rules & Simulation ==========

@app.post("/rules/auto")
def create_auto_rule(payload: dict, user=Depends(require_admin)):
    db = SessionLocal()
    rule = Rule(
        field=payload.get("field"),
        operator=payload.get("operator"),
        value=payload.get("value"),
        priority=payload.get("priority", 50),
        automation="auto"
    )
    db.add(rule)
    db.commit()
    db.close()
    log_audit(user['username'], f"create_auto_rule:{rule.id}")
    return {"id": rule.id, "message": "Auto-rule created"}

@app.post("/rules/simulate/{rule_id}")
def simulate_rule(rule_id: int, user=Depends(get_current_user)):
    db = SessionLocal()
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        db.close()
        raise HTTPException(status_code=404, detail="Rule not found")
    
    logs = db.query(Log).all()
    blocked_count = 0
    for log in logs:
        if apply_rules({"field": rule.field, "value": log.prediction}, [rule]) == 1:
            blocked_count += 1
    
    rule.simulated_blocks = blocked_count
    db.commit()
    db.close()
    return {"rule_id": rule_id, "simulated_blocks": blocked_count}


# ========== FEATURE 10: Notifications ==========

@app.post("/notification-config")
def create_notification_config(payload: dict, user=Depends(get_current_user)):
    db = SessionLocal()
    config = NotificationConfig(
        user_id=user['id'],
        channel=payload.get("channel"),
        threshold=payload.get("threshold"),
        enabled=payload.get("enabled", "true")
    )
    db.add(config)
    db.commit()
    db.close()
    return {"id": config.id, "message": "Notification config created"}

@app.get("/notification-config")
def get_notification_config(user=Depends(get_current_user)):
    db = SessionLocal()
    configs = db.query(NotificationConfig).filter(NotificationConfig.user_id == user['id']).all()
    db.close()
    return [
        {
            "id": c.id,
            "channel": c.channel,
            "threshold": c.threshold,
            "enabled": c.enabled
        }
        for c in configs
    ]


# ========== FEATURE 11: Pipeline Status ==========

@app.get("/pipeline/status")
def get_pipeline_status(user=Depends(get_current_user)):
    db = SessionLocal()
    
    # Initialize if empty
    if db.query(PipelineStatus).count() == 0:
        for component in ["kafka", "processor", "database"]:
            ps = PipelineStatus(
                component=component,
                status="healthy",
                packets_per_sec=1250,
                latency_ms=45
            )
            db.add(ps)
        db.commit()
    
    statuses = db.query(PipelineStatus).all()
    db.close()
    return [
        {
            "component": s.component,
            "status": s.status,
            "packets_per_sec": s.packets_per_sec,
            "latency_ms": s.latency_ms,
            "last_update": s.last_update.isoformat()
        }
        for s in statuses
    ]

@app.post("/pipeline/update")
def update_pipeline_status(payload: dict, user=Depends(require_admin)):
    db = SessionLocal()
    component = payload.get("component")
    status = db.query(PipelineStatus).filter(PipelineStatus.component == component).first()
    if status:
        status.status = payload.get("status", status.status)
        status.packets_per_sec = payload.get("packets_per_sec", status.packets_per_sec)
        status.latency_ms = payload.get("latency_ms", status.latency_ms)
        status.last_update = datetime.utcnow()
        db.commit()
    db.close()
    return {"message": f"Pipeline {component} updated"}


# ========== FEATURE 12: Display Audit Logs (Enhanced) ==========

@app.get("/audit-logs/detailed")
def get_detailed_audit_logs(user=Depends(require_admin), limit: int = 200):
    db = SessionLocal()
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    db.close()
    return [
        {
            "id": l.id,
            "user": l.user,
            "action": l.action,
            "timestamp": l.timestamp.isoformat(),
            "action_type": l.action.split(":")[0] if ":" in l.action else l.action
        }
        for l in logs
    ]


# ========== FEATURE 13: Dashboard Run Detection ==========

@app.post("/predict/detect")
def run_detection(payload: dict, user=Depends(get_current_user)):
    """Run inference on a 41-feature NSL-KDD sample from the Dashboard.
    Accepts raw feature values including categorical strings.
    Returns prediction, confidence, and attack category."""
    if not model_status["loaded"]:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    db = None
    try:
        emit_console("INFO", "ML-ENGINE", "Received detection request from Dashboard")
        
        sample = payload.get("features", payload)
        
        # Build DataFrame with correct feature order
        sample_df = pd.DataFrame([sample])
        
        # Ensure all 41 features present, fill missing with 0
        for col in features:
            if col not in sample_df.columns:
                sample_df[col] = 0
        
        emit_console("INFO", "PREPROCESS", "Encoding categoricals & scaling features")
        
        # Preprocess
        sample_array = preprocess_single(sample_df, encoders, scaler, features)[0]
        
        emit_console("INFO", "ML-ENGINE", "Running RandomForest inference...")
        
        # Predict with probability
        pred = rf.predict([sample_array])[0]
        proba = rf.predict_proba([sample_array])[0]
        confidence = float(max(proba))
        label = "attack" if pred == 1 else "normal"
        
        # Determine attack category heuristic
        attack_category = "Normal"
        if label == "attack":
            src_bytes = float(sample.get("src_bytes", 0))
            dst_bytes = float(sample.get("dst_bytes", 0))
            count_val = float(sample.get("count", 0))
            serror = float(sample.get("serror_rate", 0))
            num_failed = float(sample.get("num_failed_logins", 0))
            root_shell = float(sample.get("root_shell", 0))
            
            if count_val > 100 and serror > 0.5:
                attack_category = "DoS"
            elif count_val > 50 or float(sample.get("diff_srv_rate", 0)) > 0.5:
                attack_category = "Probe"
            elif num_failed > 3:
                attack_category = "R2L"
            elif root_shell > 0:
                attack_category = "U2R"
            else:
                attack_category = "DoS"
        
        emit_console(
            "ALERT" if label == "attack" else "INFO",
            "ML-ENGINE",
            f"Result: {label.upper()} — {attack_category} (confidence {confidence:.1%})"
        )
        
        # Save to DB
        db = SessionLocal()
        log = Log(user_id=user.get("id"), prediction=label)
        db.add(log)
        
        source_ip = sample.get("src_ip", "manual-input")
        severity = "critical" if confidence > 0.95 and label == "attack" else "high" if label == "attack" else "low"
        
        if label == "attack":
            # Apply block rules immediately for manual detection traffic.
            rule_rows = db.query(Rule).all()
            blocked = False
            for rule in rule_rows:
                enabled = (rule.enabled or "true").lower() == "true"
                rule_type = (rule.type or "block").lower()
                if not enabled or rule_type != "block":
                    continue

                candidates = []
                if rule.source_ip:
                    candidates.append(rule.source_ip)
                if rule.field == "src_ip" and rule.operator in ["==", "="] and rule.value:
                    candidates.append(rule.value)

                for value in candidates:
                    if value.endswith(".*") and source_ip.startswith(value[:-1]):
                        blocked = True
                    elif value.endswith(".") and source_ip.startswith(value):
                        blocked = True
                    elif source_ip == value:
                        blocked = True
                    if blocked:
                        break
                if blocked:
                    break

            if blocked:
                emit_console("WARN", "RULES", f"Blocked source IP skipped: {source_ip}")
                db.commit()
                db.close()
                return {
                    "prediction": label,
                    "confidence": confidence,
                    "attack_category": attack_category,
                    "severity": severity,
                    "blocked": True,
                    "message": f"Source IP {source_ip} blocked by rules",
                }

            alert = Alert(
                type="Intrusion Detected",
                severity=severity,
                source_ip=source_ip,
                attack_category=attack_category,
                status="unlinked",
                raw_features=json.dumps(sample)
            )
            db.add(alert)
            db.flush()
            
            # Auto-group
            incident_id = auto_group_alert_to_incident(db, alert)
            if not incident_id:
                incident = Incident(
                    title=f"Detection: {attack_category} from {source_ip}",
                    description=f"Manual detection — confidence {confidence:.1%}",
                    severity=severity,
                    source_ips=source_ip,
                    attack_type=attack_category,
                    status="open",
                    alert_count=1
                )
                db.add(incident)
                db.flush()
                alert.incident_id = incident.id
                alert.status = "linked"
            
            db.add(Notification(message=f"Detection: {attack_category} (confidence {confidence:.1%})", status="unread"))
        
        db.commit()
        db.close()
        
        return {
            "prediction": label,
            "confidence": confidence,
            "attack_category": attack_category,
            "severity": severity
        }
    except Exception as e:
        if db:
            db.close()
        emit_console("ALERT", "ML-ENGINE", f"Inference error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ========== FEATURE 14: Real Model Metrics ==========

@app.get("/models/metrics")
def get_model_metrics(user=Depends(get_current_user)):
    """Return actual model evaluation metrics from the loaded RF model.
    Runs a quick evaluation on a sample of the training data."""
    if not model_status["loaded"]:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
        from sklearn.model_selection import train_test_split
        
        # Load and preprocess data
        df = load_data()
        df_clean = df.drop(columns=["difficulty"])
        df_clean["label"] = df_clean["label"].apply(lambda x: 0 if x == "normal" else 1)
        
        categorical_cols = ["protocol_type", "service", "flag"]
        for col in categorical_cols:
            le = encoders[col]
            df_clean[col] = df_clean[col].apply(lambda x: le.transform([x])[0] if x in le.classes_ else 0)
        
        df_clean = df_clean.fillna(0)
        X = df_clean.drop("label", axis=1)
        y = df_clean["label"]
        
        X = X[features]
        X_scaled = scaler.transform(X)
        
        # Use a subset for speed
        _, X_test, _, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42, stratify=y)
        
        y_pred = rf.predict(X_test)
        
        # Feature importance
        fi = rf.feature_importances_
        fi_list = sorted(
            [{"feature": features[i], "importance": float(fi[i])} for i in range(len(features))],
            key=lambda x: x["importance"], reverse=True
        )[:15]
        
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        return {
            "models": [
                {
                    "id": "rf-prod",
                    "name": "Random Forest Classifier",
                    "version": "v2.3 (Production)",
                    "algorithm": "Random Forest",
                    "accuracy": float(accuracy_score(y_test, y_pred)),
                    "precision": float(precision_score(y_test, y_pred, zero_division=0)),
                    "recall": float(recall_score(y_test, y_pred, zero_division=0)),
                    "f1_score": float(f1_score(y_test, y_pred, zero_division=0)),
                    "confusion_matrix": cm,
                    "feature_importance": fi_list,
                    "is_active": True,
                    "trained_on": "2026-03-01T00:00:00Z",
                    "deployed_at": "2026-03-15T09:00:00Z",
                    "dataset_size": len(y)
                }
            ]
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ========== FEATURE 15: File Upload & Bulk Inference ==========

@app.post("/upload")
async def upload_and_predict(file: UploadFile = File(...), user=Depends(get_current_user)):
    """Accept a CSV file, run bulk inference, return results."""
    if not model_status["loaded"]:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        emit_console("INFO", "UPLOAD", f"Received file: {file.filename}")
        
        contents = await file.read()
        
        # Detect file type
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(".txt"):
            # Try KDD format (no header)
            column_names = [
                "duration","protocol_type","service","flag","src_bytes","dst_bytes","land",
                "wrong_fragment","urgent","hot","num_failed_logins","logged_in","num_compromised",
                "root_shell","su_attempted","num_root","num_file_creations","num_shells",
                "num_access_files","num_outbound_cmds","is_host_login","is_guest_login",
                "count","srv_count","serror_rate","srv_serror_rate","rerror_rate","srv_rerror_rate",
                "same_srv_rate","diff_srv_rate","srv_diff_host_rate","dst_host_count",
                "dst_host_srv_count","dst_host_same_srv_rate","dst_host_diff_srv_rate",
                "dst_host_same_src_port_rate","dst_host_srv_diff_host_rate",
                "dst_host_serror_rate","dst_host_srv_serror_rate","dst_host_rerror_rate",
                "dst_host_srv_rerror_rate","label","difficulty"
            ]
            df = pd.read_csv(io.BytesIO(contents), names=column_names)
            # Drop extra columns
            for col in ["label", "difficulty"]:
                if col in df.columns:
                    df = df.drop(columns=[col])
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use .csv or .txt")
        
        emit_console("INFO", "UPLOAD", f"Parsed {len(df)} rows, {len(df.columns)} columns")
        
        # Ensure feature columns exist
        for col in features:
            if col not in df.columns:
                df[col] = 0
        
        # Preprocess
        emit_console("INFO", "PREPROCESS", f"Preprocessing {len(df)} samples...")
        processed = preprocess_single(df[features], encoders, scaler, features)
        
        # Predict
        emit_console("INFO", "ML-ENGINE", f"Running batch inference on {len(df)} samples...")
        preds = rf.predict(processed)
        probas = rf.predict_proba(processed)
        
        results = []
        attacks = 0
        for i in range(len(preds)):
            label = "attack" if preds[i] == 1 else "normal"
            confidence = float(max(probas[i]))
            if label == "attack":
                attacks += 1
            results.append({
                "row": i + 1,
                "prediction": label,
                "confidence": round(confidence, 4),
                "src_bytes": int(df.iloc[i].get("src_bytes", 0)),
                "dst_bytes": int(df.iloc[i].get("dst_bytes", 0)),
                "protocol": str(df.iloc[i].get("protocol_type", "unknown")),
                "service": str(df.iloc[i].get("service", "unknown")),
            })
        
        emit_console(
            "WARN" if attacks > 0 else "INFO",
            "ML-ENGINE",
            f"Bulk complete: {attacks} attacks / {len(preds)} total ({attacks/len(preds)*100:.1f}% malicious)"
        )
        
        return {
            "filename": file.filename,
            "total_rows": len(preds),
            "attacks": attacks,
            "normal": len(preds) - attacks,
            "results": results[:500]  # Cap at 500 for UI
        }
    except HTTPException:
        raise
    except Exception as e:
        emit_console("ALERT", "UPLOAD", f"Bulk inference error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ========== FEATURE 16: SSE Console Stream ==========

@app.get("/console/stream")
async def console_stream(user=Depends(get_current_user)):
    """Server-Sent Events stream of console log entries"""
    async def event_generator():
        last_index = 0
        while True:
            current_len = len(console_log_buffer)
            if current_len > last_index:
                # Send new entries
                new_entries = list(console_log_buffer)[:current_len - last_index]
                for entry in reversed(new_entries):
                    yield f"data: {json.dumps(entry)}\n\n"
                last_index = current_len
            yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
            await asyncio.sleep(1)
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ========== FEATURE 17: Health Check (for TopNav System Status) ==========

@app.get("/health")
def health_check():
    """Returns system health — no auth required for status indicator"""
    db_ok = False
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_ok = True
    except Exception:
        pass
    
    return {
        "status": "online" if model_status["loaded"] and db_ok else "degraded",
        "model_loaded": model_status["loaded"],
        "model_name": model_status["model_name"],
        "optional_models": model_status.get("optional_models", {}),
        "database": "connected" if db_ok else "disconnected",
        "timestamp": datetime.utcnow().isoformat()
    }


# ========== FEATURE 18: Enhanced Rules CRUD ==========

@app.post("/rules")
def create_rule(payload: dict, user=Depends(get_current_user)):
    """Create a new detection rule from the Rules page"""
    db = SessionLocal()
    field = payload.get("field", "src_ip")
    value = payload.get("value", "")
    source_ip = payload.get("source_ip") or (value if field == "src_ip" else None)
    rule_type = payload.get("type") or ("block" if payload.get("automation", "manual") == "auto" else "allow")

    rule = Rule(
        field=field,
        operator=payload.get("operator", "=="),
        value=value,
        priority=payload.get("priority", 50),
        automation=payload.get("automation", "manual"),
        type=rule_type,
        source_ip=source_ip,
        enabled="true" if payload.get("enabled", True) else "false",
    )
    db.add(rule)
    db.commit()
    result = {
        "id": rule.id,
        "field": rule.field,
        "operator": rule.operator,
        "value": rule.value,
        "priority": rule.priority,
        "automation": rule.automation,
        "simulated_blocks": rule.simulated_blocks,
        "type": rule.type,
        "source_ip": rule.source_ip,
        "enabled": (rule.enabled or "true").lower() == "true",
        "timestamp": rule.timestamp.isoformat()
    }
    db.close()
    log_audit(user['username'], f"create_rule:{rule.id}")
    emit_console("INFO", "FIREWALL", f"New rule created: {rule.field} {rule.operator} {rule.value}")
    return result

@app.delete("/rules/{rule_id}")
def delete_rule_by_id(rule_id: int, user=Depends(get_current_user)):
    """Delete a rule by ID"""
    db = SessionLocal()
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        db.close()
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    db.close()
    log_audit(user['username'], f"delete_rule:{rule_id}")
    emit_console("WARN", "FIREWALL", f"Rule {rule_id} deleted")
    return {"message": "Rule deleted"}
# ========== REAL-TIME STREAMING ENDPOINTS ==========

@app.get("/dashboard")
def get_dashboard_snapshot(user=Depends(get_current_user)):
    db = SessionLocal()
    alerts_count = db.query(Alert).count()
    active_incidents = db.query(Incident).filter(Incident.status.in_(["open", "investigating", "Open", "Investigating"])).count()
    attacks = {
        "DoS": db.query(Alert).filter(Alert.attack_category == "DoS").count(),
        "Probe": db.query(Alert).filter(Alert.attack_category == "Probe").count(),
        "R2L": db.query(Alert).filter(Alert.attack_category == "R2L").count(),
        "U2R": db.query(Alert).filter(Alert.attack_category == "U2R").count(),
    }
    db.close()

    timeline = []
    now = datetime.utcnow()
    for i in range(12):
        bucket = now - timedelta(minutes=(11 - i) * 5)
        timeline.append({
            "time": bucket.strftime("%H:%M"),
            "normal": max(0, 100 - ((alerts_count + i) % 25)),
            "dos": (attacks["DoS"] + i) % 20,
            "probe": (attacks["Probe"] + i) % 14,
        })

    return {
        "total_traffic": realtime_engine.total_traffic if realtime_engine else 0,
        "total_alerts": alerts_count,
        "active_incidents": active_incidents,
        "attack_distribution": attacks,
        "timeline": timeline,
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/datasets")
def get_datasets(user=Depends(get_current_user)):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    datasets = []
    for filename in ["KDDTrain+.txt", "KDDTest+.txt"]:
        full_path = os.path.join(data_dir, filename)
        if os.path.exists(full_path):
            size_mb = os.path.getsize(full_path) / (1024 * 1024)
            datasets.append({
                "name": filename,
                "type": "train" if "Train" in filename else "test",
                "size_mb": round(size_mb, 2),
                "status": "ready",
                "uploaded_at": datetime.utcfromtimestamp(os.path.getmtime(full_path)).isoformat(),
            })
    return {"datasets": datasets}


@app.get("/threat-intel")
def get_threat_intel(user=Depends(get_current_user)):
    db = SessionLocal()
    rows = db.query(
        Alert.source_ip,
        func.count(Alert.id).label("attacks"),
        func.max(Alert.timestamp).label("last_seen"),
    ).filter(Alert.source_ip != None).group_by(Alert.source_ip).order_by(func.count(Alert.id).desc()).limit(100).all()

    items = []
    for source_ip, attacks, last_seen in rows:
        score = min(100, 40 + int(attacks) * 6)
        if score >= 85:
            label = "malicious"
        elif score >= 60:
            label = "suspicious"
        else:
            label = "internal"
        items.append({
            "source_ip": source_ip,
            "attacks": int(attacks),
            "last_seen": last_seen.isoformat() if last_seen else None,
            "score": score,
            "label": label,
        })
    db.close()
    return {"items": items}


@app.websocket("/ws/alerts")
async def ws_alerts(websocket: WebSocket):
    if not realtime_engine:
        await websocket.accept()
        await websocket.send_json({"error": "Realtime engine unavailable"})
        await websocket.close()
        return

    await realtime_engine.hub.connect("alerts", websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        realtime_engine.hub.disconnect("alerts", websocket)


@app.websocket("/ws/incidents")
async def ws_incidents(websocket: WebSocket):
    if not realtime_engine:
        await websocket.accept()
        await websocket.send_json({"error": "Realtime engine unavailable"})
        await websocket.close()
        return

    await realtime_engine.hub.connect("incidents", websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        realtime_engine.hub.disconnect("incidents", websocket)


@app.websocket("/ws/dashboard")
async def ws_dashboard(websocket: WebSocket):
    if not realtime_engine:
        await websocket.accept()
        await websocket.send_json({"error": "Realtime engine unavailable"})
        await websocket.close()
        return

    await realtime_engine.hub.connect("dashboard", websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        realtime_engine.hub.disconnect("dashboard", websocket)


@app.websocket("/ws/logs")
async def ws_logs(websocket: WebSocket):
    if not realtime_engine:
        await websocket.accept()
        await websocket.send_json({"error": "Realtime engine unavailable"})
        await websocket.close()
        return

    await realtime_engine.hub.connect("logs", websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        realtime_engine.hub.disconnect("logs", websocket)
