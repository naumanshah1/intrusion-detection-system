from fastapi import FastAPI
import joblib
import os
import pandas as pd

from src.preprocessing import load_data, preprocess_single
from src.hybrid_model import hybrid_predict
from src.thresholds import compute_thresholds
from src.database import SessionLocal, Log

app = FastAPI(title="Intrusion Detection API")

# -----------------------------
# Load models + preprocessing
# -----------------------------
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_dir = os.path.join(base_dir, "models")

rf = joblib.load(os.path.join(model_dir, "rf.pkl"))
encoders = joblib.load(os.path.join(model_dir, "encoders.pkl"))
scaler = joblib.load(os.path.join(model_dir, "scaler.pkl"))
features = joblib.load(os.path.join(model_dir, "features.pkl"))

# Load dataset for thresholds
df = load_data()
thresholds = compute_thresholds(df)

# -----------------------------
# Routes
# -----------------------------
@app.get("/")
def home():
    return {"message": "IDS API Running 🚀"}


@app.post("/predict")
def predict(sample: dict):
    try:
        # Convert input → DataFrame
        sample_df = pd.DataFrame([sample])

        # Preprocess
        sample_array = preprocess_single(
            sample_df, encoders, scaler, features
        )[0]

        # Predict
        pred = hybrid_predict(sample, sample_array, rf, thresholds)
        label = "attack" if pred == 1 else "normal"

        # -----------------------------
        # Save to DB
        # -----------------------------
        db = SessionLocal()
        log = Log(prediction=label)
        db.add(log)
        db.commit()
        db.close()

        return {"prediction": label}

    except Exception as e:
        return {
            "error": str(e),
            "message": "Invalid input format"
        }


# -----------------------------
# Logs endpoint
# -----------------------------
@app.get("/logs")
def get_logs():
    db = SessionLocal()
    logs = db.query(Log).all()
    db.close()

    return [
        {"id": log.id, "prediction": log.prediction}
        for log in logs
    ]