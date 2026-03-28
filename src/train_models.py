import os
import joblib
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.metrics import classification_report

from src.preprocessing import load_data, preprocess


def main():
    print("📥 Loading data...")

    df = load_data()
    X, y, encoders, scaler, feature_columns = preprocess(df)

    print("✅ Data ready!")
    print("Shape:", X.shape)

    # -----------------------------
    # Train-test split
    # -----------------------------
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    # -----------------------------
    # Train Models
    # -----------------------------
    print("\n🔹 Training Logistic Regression...")
    lr = LogisticRegression(max_iter=1000)
    lr.fit(X_train, y_train)
    print(classification_report(y_test, lr.predict(X_test)))

    print("\n🔹 Training Random Forest...")
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    print(classification_report(y_test, rf.predict(X_test)))

    print("\n🔹 Training Isolation Forest...")
    iso = IsolationForest(contamination=0.1, random_state=42)
    iso.fit(X_train)

    y_iso = np.where(iso.predict(X_test) == -1, 1, 0)
    print(classification_report(y_test, y_iso))

    # -----------------------------
    # Save Models + Preprocessing
    # -----------------------------
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_dir = os.path.join(base_dir, "models")
    os.makedirs(model_dir, exist_ok=True)

    joblib.dump(lr, os.path.join(model_dir, "lr.pkl"))
    joblib.dump(rf, os.path.join(model_dir, "rf.pkl"))
    joblib.dump(iso, os.path.join(model_dir, "iso.pkl"))
    joblib.dump(encoders, os.path.join(model_dir, "encoders.pkl"))
    joblib.dump(scaler, os.path.join(model_dir, "scaler.pkl"))
    joblib.dump(feature_columns, os.path.join(model_dir, "features.pkl"))

    print("\n✅ Models + preprocessing saved successfully!")


if __name__ == "__main__":
    main()