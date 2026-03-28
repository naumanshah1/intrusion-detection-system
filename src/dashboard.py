import streamlit as st
import requests
import pandas as pd
import matplotlib.pyplot as plt
import time

st.set_page_config(page_title="IDS Dashboard", layout="wide")

st.title("🚨 Intrusion Detection System (Production Dashboard)")

API_URL = "https://ids-api.onrender.com"

# -----------------------------
# SIDEBAR INPUT
# -----------------------------
st.sidebar.header("🔧 Traffic Input")

def get_input():
    return {
        "duration": 0,
        "protocol_type": st.sidebar.selectbox("Protocol", ["tcp", "udp", "icmp"]),
        "service": st.sidebar.text_input("Service", "http"),
        "flag": st.sidebar.text_input("Flag", "SF"),
        "src_bytes": st.sidebar.slider("src_bytes", 0, 200000, 200),
        "dst_bytes": st.sidebar.slider("dst_bytes", 0, 200000, 500),
        "land": 0,
        "wrong_fragment": 0,
        "urgent": 0,
        "hot": 0,
        "num_failed_logins": st.sidebar.slider("failed_logins", 0, 20, 0),
        "logged_in": st.sidebar.selectbox("logged_in", [0,1]),
        "num_compromised": 0,
        "root_shell": st.sidebar.selectbox("root_shell", [0,1]),
        "su_attempted": 0,
        "num_root": 0,
        "num_file_creations": 0,
        "num_shells": 0,
        "num_access_files": 0,
        "num_outbound_cmds": 0,
        "is_host_login": 0,
        "is_guest_login": 0,
        "count": st.sidebar.slider("count", 0, 300, 10),
        "srv_count": st.sidebar.slider("srv_count", 0, 300, 10),
        "serror_rate": st.sidebar.slider("serror_rate", 0.0, 1.0, 0.0),
        "srv_serror_rate": 0,
        "rerror_rate": 0,
        "srv_rerror_rate": 0,
        "same_srv_rate": 1,
        "diff_srv_rate": 0,
        "srv_diff_host_rate": 0,
        "dst_host_count": 10,
        "dst_host_srv_count": 10,
        "dst_host_same_srv_rate": 1,
        "dst_host_diff_srv_rate": 0,
        "dst_host_same_src_port_rate": 1,
        "dst_host_srv_diff_host_rate": 0,
        "dst_host_serror_rate": 0,
        "dst_host_srv_serror_rate": 0,
        "dst_host_rerror_rate": 0,
        "dst_host_srv_rerror_rate": 0
    }

input_data = get_input()

# -----------------------------
# DETECT BUTTON
# -----------------------------
col1, col2 = st.columns(2)

with col1:
    if st.button("🚀 Detect"):
        try:
            res = requests.post(f"{API_URL}/predict", json=input_data, timeout=5)
            result = res.json()

            if result.get("prediction") == "attack":
                st.error("🚨 ATTACK DETECTED")
            else:
                st.success("✅ NORMAL TRAFFIC")
        except requests.exceptions.RequestException as e:
            st.error(f"Unable to connect to API: {e}")

with col2:
    if st.button("🔄 Simulate (10)"):
        try:
            for _ in range(10):
                requests.post(f"{API_URL}/predict", json=input_data, timeout=5)
                time.sleep(0.3)
            st.success("Simulation Complete")
        except requests.exceptions.RequestException as e:
            st.error(f"Unable to connect to API during simulation: {e}")

# -----------------------------
# FETCH LOGS FROM API
# -----------------------------
st.subheader("📊 Live Statistics")

try:
    logs_res = requests.get(f"{API_URL}/logs", timeout=5)
    logs = logs_res.json()
except requests.exceptions.RequestException as e:
    st.error(f"Unable to connect to API: {e}")
    logs = []

if logs:
    df = pd.DataFrame(logs)

    attack_count = (df["prediction"] == "attack").sum()
    normal_count = (df["prediction"] == "normal").sum()

    c1, c2, c3 = st.columns(3)

    c1.metric("Total Requests", len(df))
    c2.metric("Attacks", attack_count)
    c3.metric("Normal", normal_count)

    # -----------------------------
    # BAR CHART
    # -----------------------------
    fig, ax = plt.subplots()
    ax.bar(["Attack", "Normal"], [attack_count, normal_count])
    ax.set_title("Attack vs Normal")

    st.pyplot(fig)

    # -----------------------------
    # PIE CHART
    # -----------------------------
    fig2, ax2 = plt.subplots()
    ax2.pie(
        [attack_count, normal_count],
        labels=["Attack", "Normal"],
        autopct="%1.1f%%"
    )
    ax2.set_title("Traffic Distribution")

    st.pyplot(fig2)

    # -----------------------------
    # LOG TABLE
    # -----------------------------
    st.subheader("📜 Logs")
    st.dataframe(df.tail(20))