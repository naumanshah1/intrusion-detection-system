import os
import numpy as np
import joblib

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split

from src.preprocessing import load_data, preprocess
from src.hybrid_model import hybrid_predict
from src.thresholds import compute_thresholds
from src.visualize import plot_accuracy, plot_metrics, plot_conf_matrix


# -----------------------------
# Metric Functions
# -----------------------------
def get_metrics(y_true, y_pred):
    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred),
        "recall": recall_score(y_true, y_pred),
        "f1": f1_score(y_true, y_pred)
    }


def print_metrics(name, m):
    print(f"\n{name}")
    print(f"Accuracy  : {m['accuracy']:.4f}")
    print(f"Precision : {m['precision']:.4f}")
    print(f"Recall    : {m['recall']:.4f}")
    print(f"F1 Score  : {m['f1']:.4f}")


# -----------------------------
# MAIN
# -----------------------------
def main():
    print("📥 Loading and preprocessing data...")

    df = load_data()
    X, y = preprocess(df)

    # Train-test split (same as training)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("✅ Using test data for evaluation")

    # -----------------------------
    # 🔥 Compute Dynamic Thresholds
    # -----------------------------
    thresholds = compute_thresholds(df)

    # -----------------------------
    # Load Models
    # -----------------------------
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, "models")

    lr = joblib.load(os.path.join(models_dir, "lr.pkl"))
    rf = joblib.load(os.path.join(models_dir, "rf.pkl"))
    iso = joblib.load(os.path.join(models_dir, "iso.pkl"))

    # -----------------------------
    # Predictions
    # -----------------------------
    y_lr = lr.predict(X_test)
    y_rf = rf.predict(X_test)

    y_iso = iso.predict(X_test)
    y_iso = np.where(y_iso == -1, 1, 0)

    # -----------------------------
    # Hybrid Predictions
    # -----------------------------
    y_hybrid = []

    for i in range(len(X_test)):
        sample_dict = df.iloc[i]   # row from original dataframe
        pred = hybrid_predict(sample_dict, X_test[i], rf, thresholds)
        y_hybrid.append(pred)

    # -----------------------------
    # Metrics
    # -----------------------------
    metrics_lr = get_metrics(y_test, y_lr)
    metrics_rf = get_metrics(y_test, y_rf)
    metrics_iso = get_metrics(y_test, y_iso)
    metrics_hybrid = get_metrics(y_test, y_hybrid)

    # -----------------------------
    # Print Results
    # -----------------------------
    print_metrics("Logistic Regression", metrics_lr)
    print_metrics("Random Forest", metrics_rf)
    print_metrics("Isolation Forest", metrics_iso)
    print_metrics("Hybrid Model", metrics_hybrid)

    # -----------------------------
    # Visualization Data
    # -----------------------------
    models = ["LR", "RF", "ISO", "HYBRID"]

    accuracy = [
        metrics_lr["accuracy"],
        metrics_rf["accuracy"],
        metrics_iso["accuracy"],
        metrics_hybrid["accuracy"]
    ]

    precision = [
        metrics_lr["precision"],
        metrics_rf["precision"],
        metrics_iso["precision"],
        metrics_hybrid["precision"]
    ]

    recall = [
        metrics_lr["recall"],
        metrics_rf["recall"],
        metrics_iso["recall"],
        metrics_hybrid["recall"]
    ]

    f1 = [
        metrics_lr["f1"],
        metrics_rf["f1"],
        metrics_iso["f1"],
        metrics_hybrid["f1"]
    ]

    # -----------------------------
    # Plots
    # -----------------------------
    plot_accuracy(models, accuracy)
    plot_metrics(models, precision, recall, f1)
    plot_conf_matrix(y_test, y_hybrid, title="Hybrid Model Confusion Matrix")


if __name__ == "__main__":
    main()