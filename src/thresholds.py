import pandas as pd

def compute_thresholds(df):
    """
    Compute dynamic thresholds using statistical properties
    """

    thresholds = {}

    # 🔥 Use mean + k * std (k = 2 or 3 depending on strictness)

    thresholds["src_bytes"] = df["src_bytes"].mean() + 2 * df["src_bytes"].std()
    thresholds["dst_bytes"] = df["dst_bytes"].mean() + 2 * df["dst_bytes"].std()

    thresholds["count"] = df["count"].mean() + 2 * df["count"].std()
    thresholds["srv_count"] = df["srv_count"].mean() + 2 * df["srv_count"].std()

    thresholds["serror_rate"] = df["serror_rate"].mean() + 2 * df["serror_rate"].std()
    thresholds["srv_serror_rate"] = df["srv_serror_rate"].mean() + 2 * df["srv_serror_rate"].std()

    thresholds["dst_host_serror_rate"] = df["dst_host_serror_rate"].mean() + 2 * df["dst_host_serror_rate"].std()

    thresholds["diff_srv_rate"] = df["diff_srv_rate"].mean() + 2 * df["diff_srv_rate"].std()
    thresholds["srv_diff_host_rate"] = df["srv_diff_host_rate"].mean() + 2 * df["srv_diff_host_rate"].std()

    return thresholds