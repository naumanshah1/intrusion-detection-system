import requests
import json
import time

# Update with your active API token or hardcode here for testing
API_TOKEN = "<ENTER_VALID_JWT_TOKEN>"
HEADERS = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}
BASE_URL = "http://localhost:8000"

# Sample traffic payload matching the expected IDS model features
sample_payload = {
    "duration": 0.0,
    "protocol_type": "tcp",
    "service": "http",
    "flag": "SF",
    "src_bytes": 215,
    "dst_bytes": 456,
    "land": 0,
    "wrong_fragment": 0,
    "urgent": 0
}

def stream_to_kafka():
    print("🚀 Starting Data Pipeline Streaming (Kafka Test)")
    
    # 1. Publish to Kafka
    publish_url = f"{BASE_URL}/kafka/publish"
    data = {
        "topic": "network-traffic",
        "message": sample_payload
    }
    
    try:
        response = requests.post(publish_url, headers=HEADERS, json=data)
        if response.status_code == 200:
            print("✅ Successfully published traffic to Kafka topic 'network-traffic'.")
            print("Message:", response.json())
        elif response.status_code == 501:
            print("❌ Kafka is not available in the environment. Please run a Kafka broker on localhost:9092 and restart the API.")
            return
        else:
            print(f"⚠️ Failed to publish. Status {response.status_code}: {response.text}")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the Backend API. Ensure it is running on port 8000.")
        return

    time.sleep(2) # simulate slight delay for consumer

    # 2. Consume from Kafka
    consume_url = f"{BASE_URL}/kafka/consume"
    try:
        response = requests.get(consume_url, headers=HEADERS)
        if response.status_code == 200:
            messages = response.json().get("messages", [])
            print(f"📥 Consumed {len(messages)} messages from Kafka topic.")
            for msg in messages:
                print(" -> ", msg)
        else:
            print(f"⚠️ Failed to consume. Status {response.status_code}: {response.text}")
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API.")

if __name__ == "__main__":
    if API_TOKEN == "<ENTER_VALID_JWT_TOKEN>":
        print("Please replace <ENTER_VALID_JWT_TOKEN> with a valid JWT token obtained from logging in.")
    else:
        stream_to_kafka()
