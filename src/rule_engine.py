def rule_based_detection(sample, thresholds):
    """
    Dynamic rule-based detection using dataset statistics
    """

    # -----------------------------
    # 🔥 1. Extreme Traffic
    # -----------------------------
    if sample["src_bytes"] > thresholds["src_bytes"] and sample["dst_bytes"] > thresholds["dst_bytes"]:
        return 1

    # -----------------------------
    # 🔥 2. High Connections + Errors
    # -----------------------------
    if sample["count"] > thresholds["count"] and sample["serror_rate"] > thresholds["serror_rate"]:
        return 1

    # -----------------------------
    # 🔥 3. Login Anomaly
    # -----------------------------
    if sample["num_failed_logins"] > 5 and sample["logged_in"] == 0:
        return 1

    # -----------------------------
    # 🔥 4. Privilege Escalation
    # -----------------------------
    if sample["root_shell"] == 1 or sample["su_attempted"] > 1:
        return 1

    # -----------------------------
    # 🔥 5. Host-Level Attack
    # -----------------------------
    if sample["dst_host_serror_rate"] > thresholds["dst_host_serror_rate"]:
        return 1

    # -----------------------------
    # 🔥 6. Service Pattern
    # -----------------------------
    if sample["diff_srv_rate"] > thresholds["diff_srv_rate"] and sample["srv_diff_host_rate"] > thresholds["srv_diff_host_rate"]:
        return 1

    return 0