import pandas as pd
import numpy as np
import os
from sklearn.preprocessing import LabelEncoder, StandardScaler


# -----------------------------
# Load Dataset
# -----------------------------
def load_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, "data", "KDDTrain+.txt")

    # Full column names (NSL-KDD)
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

    df = pd.read_csv(file_path, names=column_names)

    return df


# -----------------------------
# Preprocessing
# -----------------------------
def preprocess(df):

    # 🔥 Drop unnecessary column
    df = df.drop(columns=["difficulty"])

    # 🔥 Convert labels → binary
    df["label"] = df["label"].apply(lambda x: 0 if x == "normal" else 1)

    # -----------------------------
    # Encode categorical features
    # -----------------------------
    categorical_cols = ["protocol_type", "service", "flag"]
    encoders = {}

    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        encoders[col] = le

    # -----------------------------
    # Remove duplicates (important)
    # -----------------------------
    df = df.drop_duplicates()

    # -----------------------------
    # Handle missing values
    # -----------------------------
    df = df.fillna(0)

    # -----------------------------
    # 🔥 REPLACED SECTION STARTS HERE
    # -----------------------------

    # Split features and labels
    X = df.drop("label", axis=1)
    y = df["label"]

    # 🔥 IMPORTANT: SAVE FEATURE ORDER
    feature_columns = X.columns.tolist()

    # Scale
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 🔥 FINAL RETURN (5 VALUES)
    return X_scaled, y, encoders, scaler, feature_columns


def preprocess_single(sample_df, encoders, scaler, feature_columns):

    # Ensure correct column order
    sample_df = sample_df[feature_columns]

    # Encode categorical safely
    for col in ["protocol_type", "service", "flag"]:
        le = encoders[col]

        # Handle unseen values
        if sample_df[col].iloc[0] not in le.classes_:
            sample_df[col] = le.classes_[0]

        sample_df[col] = le.transform(sample_df[col])

    # Handle missing values
    sample_df = sample_df.fillna(0)

    # Scale features
    return scaler.transform(sample_df)
# -----------------------------
# Optional: Feature Importance (Advanced)
# -----------------------------
def get_feature_names():
    return [
        "duration","protocol_type","service","flag","src_bytes","dst_bytes","land",
        "wrong_fragment","urgent","hot","num_failed_logins","logged_in","num_compromised",
        "root_shell","su_attempted","num_root","num_file_creations","num_shells",
        "num_access_files","num_outbound_cmds","is_host_login","is_guest_login",
        "count","srv_count","serror_rate","srv_serror_rate","rerror_rate","srv_rerror_rate",
        "same_srv_rate","diff_srv_rate","srv_diff_host_rate","dst_host_count",
        "dst_host_srv_count","dst_host_same_srv_rate","dst_host_diff_srv_rate",
        "dst_host_same_src_port_rate","dst_host_srv_diff_host_rate",
        "dst_host_serror_rate","dst_host_srv_serror_rate","dst_host_rerror_rate",
        "dst_host_srv_rerror_rate"
    ]