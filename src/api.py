from fastapi import FastAPI, Depends, HTTPException, WebSocket
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
import joblib
import os
import pandas as pd
import asyncio
import json
from datetime import datetime

# Kafka support (if kafka-python provided)
try:
    from kafka import KafkaProducer, KafkaConsumer
    kafka_available = True
except ImportError:
    kafka_available = False

from src.preprocessing import load_data, preprocess_single
from src.hybrid_model import hybrid_predict
from src.thresholds import compute_thresholds
from src.database import SessionLocal, Log, User, Alert, Rule, Notification, Config, AuditLog, APIKey, LoginHistory
from src.auth import hash_password, verify_password, create_token, decode_token
from src.rules import apply_rules
import secrets

app = FastAPI(title="Intrusion Detection API")

# Global model tracking
current_model = "hybrid"

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

rf = joblib.load(os.path.join(model_dir, "rf.pkl"))
encoders = joblib.load(os.path.join(model_dir, "encoders.pkl"))
scaler = joblib.load(os.path.join(model_dir, "scaler.pkl"))
features = joblib.load(os.path.join(model_dir, "features.pkl"))

# -----------------------------
# Auth Helper Functions
# -----------------------------
def log_audit(user: str, action: str):
    db = SessionLocal()
    db.add(AuditLog(user=user, action=action))
    db.commit()
    db.close()


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
        if db is not None and 'db_user' in locals() and db_user:
            db.add(LoginHistory(user_id=db_user.id if db_user else None, success="false"))
            db.commit()
            log_audit(credentials.get('username', 'unknown'), 'login_failed')
            db.close()
        raise
    except Exception as e:
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
            alert = Alert(type="Intrusion Detected", severity="High")
            db.add(alert)
            db.add(Notification(message=f"Attack detected from flow triggered by {username['username']}", status="unread"))

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
def get_alerts(username: str = Depends(get_current_user)):
    """Get all alerts (protected route)"""
    db = SessionLocal()
    alerts = db.query(Alert).order_by(Alert.timestamp.desc()).all()
    db.close()
    
    return [{"id": a.id, "type": a.type, "severity": a.severity, "timestamp": a.timestamp.isoformat()} for a in alerts]

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
    rules = db.query(Rule).all()
    db.close()
    
    return [{"id": r.id, "field": r.field, "operator": r.operator, "value": r.value} for r in rules]

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