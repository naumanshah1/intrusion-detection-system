import asyncio
import json
import os
import random
from datetime import datetime, timedelta

import pandas as pd
from sqlalchemy import func

from src.database import SessionLocal, Alert, Incident, Rule, Log, PipelineStatus
from src.preprocessing import preprocess_single


class WebSocketHub:
    def __init__(self):
        self.channels = {
            "alerts": set(),
            "incidents": set(),
            "dashboard": set(),
            "logs": set(),
        }

    async def connect(self, channel, websocket):
        await websocket.accept()
        self.channels[channel].add(websocket)

    def disconnect(self, channel, websocket):
        if websocket in self.channels[channel]:
            self.channels[channel].remove(websocket)

    async def broadcast(self, channel, payload):
        stale = []
        for ws in self.channels[channel]:
            try:
                await ws.send_json(payload)
            except Exception:
                stale.append(ws)
        for ws in stale:
            self.disconnect(channel, ws)


class RealtimeIDSEngine:
    def __init__(self, model, encoders, scaler, features, emit_console):
        self.model = model
        self.encoders = encoders
        self.scaler = scaler
        self.features = features
        self.emit_console = emit_console
        self.hub = WebSocketHub()
        self._task = None
        self._running = False
        self._dataset = None
        self._cursor = 0
        self.total_traffic = 0
        self.attack_distribution = {"DoS": 0, "Probe": 0, "R2L": 0, "U2R": 0}

    def _load_dataset(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        train_path = os.path.join(base_dir, "data", "KDDTrain+.txt")
        test_path = os.path.join(base_dir, "data", "KDDTest+.txt")
        columns = [
            "duration", "protocol_type", "service", "flag", "src_bytes", "dst_bytes", "land",
            "wrong_fragment", "urgent", "hot", "num_failed_logins", "logged_in", "num_compromised",
            "root_shell", "su_attempted", "num_root", "num_file_creations", "num_shells",
            "num_access_files", "num_outbound_cmds", "is_host_login", "is_guest_login",
            "count", "srv_count", "serror_rate", "srv_serror_rate", "rerror_rate", "srv_rerror_rate",
            "same_srv_rate", "diff_srv_rate", "srv_diff_host_rate", "dst_host_count",
            "dst_host_srv_count", "dst_host_same_srv_rate", "dst_host_diff_srv_rate",
            "dst_host_same_src_port_rate", "dst_host_srv_diff_host_rate",
            "dst_host_serror_rate", "dst_host_srv_serror_rate", "dst_host_rerror_rate",
            "dst_host_srv_rerror_rate", "label", "difficulty"
        ]
        train_df = pd.read_csv(train_path, names=columns)
        test_df = pd.read_csv(test_path, names=columns)
        df = pd.concat([train_df, test_df], ignore_index=True)
        self._dataset = df.sample(frac=1.0, random_state=42).reset_index(drop=True)

    def _severity_from_confidence(self, confidence):
        if confidence >= 0.95:
            return "critical"
        if confidence >= 0.85:
            return "high"
        if confidence >= 0.7:
            return "medium"
        return "low"

    def _category_from_row(self, row):
        if float(row.get("root_shell", 0)) > 0:
            return "U2R"
        if float(row.get("num_failed_logins", 0)) > 2:
            return "R2L"
        if float(row.get("count", 0)) > 100 and float(row.get("serror_rate", 0)) > 0.5:
            return "DoS"
        if float(row.get("diff_srv_rate", 0)) > 0.4 or float(row.get("srv_diff_host_rate", 0)) > 0.3:
            return "Probe"
        return random.choice(["DoS", "Probe", "R2L", "U2R"])

    def _source_ip_for_row(self, idx):
        return f"10.{(idx % 240) + 1}.{(idx * 3) % 255}.{(idx * 7) % 255}"

    def _destination_ip_for_row(self, idx):
        return f"172.16.{(idx % 32)}.{(idx % 250) + 2}"

    def _blocked_ips(self, db):
        exact = set()
        prefixes = []
        rules = db.query(Rule).all()
        for r in rules:
            enabled = (r.enabled or "true").lower() == "true"
            rule_type = (r.type or "block").lower()
            if not enabled or rule_type != "block":
                continue
            candidates = []
            if r.source_ip:
                candidates.append(r.source_ip)
            if r.field == "src_ip" and r.operator in ["==", "="] and r.value:
                candidates.append(r.value)

            for value in candidates:
                if value.endswith(".*"):
                    prefixes.append(value[:-1])
                elif value.endswith("."):
                    prefixes.append(value)
                else:
                    exact.add(value)
        return exact, prefixes

    def _is_blocked_ip(self, source_ip, exact, prefixes):
        if source_ip in exact:
            return True
        return any(source_ip.startswith(prefix) for prefix in prefixes)

    def _get_or_create_incident(self, db, source_ip, category, severity):
        window_start = datetime.utcnow() - timedelta(minutes=10)
        incident = db.query(Incident).filter(
            Incident.source_ips.like(f"%{source_ip}%"),
            Incident.attack_type == category,
            Incident.updated_at >= window_start,
            Incident.status.in_(["open", "investigating", "Open", "Investigating"]),
        ).first()

        severity_rank = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        if incident:
            current = (incident.severity or "low").lower()
            if severity_rank.get(severity, 1) > severity_rank.get(current, 1):
                incident.severity = severity
            incident.alert_count = (incident.alert_count or 0) + 1
            incident.updated_at = datetime.utcnow()
            return incident

        incident = Incident(
            incident_id=f"INC-{int(datetime.utcnow().timestamp())}-{random.randint(1000, 9999)}",
            title=f"{category} activity from {source_ip}",
            description=f"Auto-grouped incident for {category}",
            status="open",
            severity=severity,
            source_ips=source_ip,
            attack_type=category,
            alert_count=1,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(incident)
        db.flush()
        return incident

    def _dashboard_snapshot(self, db):
        total_alerts = db.query(Alert).count()
        active_incidents = db.query(Incident).filter(Incident.status.in_(["open", "investigating", "Open", "Investigating"])) .count()
        grouped = db.query(Alert.attack_category, func.count(Alert.id)).group_by(Alert.attack_category).all()
        distribution = {"DoS": 0, "Probe": 0, "R2L": 0, "U2R": 0}
        for category, count in grouped:
            if category in distribution:
                distribution[category] = count

        timeline = []
        now = datetime.utcnow()
        for i in range(12):
            bucket_start = now - timedelta(minutes=(11 - i) * 5)
            bucket_end = bucket_start + timedelta(minutes=5)
            bucket_attacks = db.query(Alert).filter(Alert.timestamp >= bucket_start, Alert.timestamp < bucket_end).count()
            timeline.append({
                "time": bucket_start.strftime("%H:%M"),
                "normal": max(0, 100 - bucket_attacks),
                "dos": bucket_attacks if i % 2 == 0 else max(0, bucket_attacks - 1),
                "probe": bucket_attacks if i % 3 == 0 else max(0, bucket_attacks - 2),
            })

        return {
            "total_traffic": self.total_traffic,
            "total_alerts": total_alerts,
            "active_incidents": active_incidents,
            "attack_distribution": distribution,
            "timeline": timeline,
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def _ensure_pipeline_status(self, db):
        components = ["ingestion", "processor", "database", "websocket"]
        for component in components:
            exists = db.query(PipelineStatus).filter(PipelineStatus.component == component).first()
            if not exists:
                db.add(PipelineStatus(component=component, status="healthy", packets_per_sec=0, latency_ms=0))
        db.commit()

    async def _run_once(self):
        if self._dataset is None:
            self._load_dataset()

        batch_size = random.randint(50, 100)
        if self._cursor + batch_size >= len(self._dataset):
            self._cursor = 0
            self._dataset = self._dataset.sample(frac=1.0).reset_index(drop=True)

        batch = self._dataset.iloc[self._cursor:self._cursor + batch_size].copy()
        self._cursor += batch_size

        self.emit_console("INFO", "INGEST", f"Ingested batch of {len(batch)} records")
        await self.hub.broadcast("logs", {
            "event": "pipeline_log",
            "timestamp": datetime.utcnow().strftime("%H:%M:%S.%f")[:-3],
            "level": "INFO",
            "source": "INGEST",
            "message": f"Ingested batch of {len(batch)} records",
        })

        feature_df = batch.drop(columns=["label", "difficulty"], errors="ignore")
        for col in self.features:
            if col not in feature_df.columns:
                feature_df[col] = 0

        processed = preprocess_single(feature_df[self.features], self.encoders, self.scaler, self.features)
        preds = self.model.predict(processed)
        probas = self.model.predict_proba(processed)

        db = SessionLocal()
        await self._ensure_pipeline_status(db)
        blocked_exact, blocked_prefixes = self._blocked_ips(db)

        alerts_payload = []
        incident_ids = set()

        for idx, pred in enumerate(preds):
            confidence = float(max(probas[idx]))
            source_ip = self._source_ip_for_row(self._cursor + idx)
            destination_ip = self._destination_ip_for_row(self._cursor + idx)

            if self._is_blocked_ip(source_ip, blocked_exact, blocked_prefixes):
                self.emit_console("WARN", "RULES", f"Blocked source IP skipped: {source_ip}")
                await self.hub.broadcast("logs", {
                    "event": "pipeline_log",
                    "timestamp": datetime.utcnow().strftime("%H:%M:%S.%f")[:-3],
                    "level": "WARN",
                    "source": "RULES",
                    "message": f"Blocked source IP skipped: {source_ip}",
                })
                continue

            db.add(Log(prediction="attack" if int(pred) == 1 else "normal"))

            if int(pred) != 1:
                continue

            row = feature_df.iloc[idx]
            category = self._category_from_row(row)
            severity = self._severity_from_confidence(confidence)
            incident = self._get_or_create_incident(db, source_ip, category, severity)

            alert = Alert(
                type="Intrusion Detected",
                severity=severity,
                source_ip=source_ip,
                destination_ip=destination_ip,
                attack_category=category,
                confidence=confidence,
                status="new",
                incident_id=incident.id,
                raw_features=json.dumps(row.to_dict()),
                timestamp=datetime.utcnow(),
            )
            db.add(alert)
            db.flush()

            incident_ids.add(incident.id)
            self.attack_distribution[category] = self.attack_distribution.get(category, 0) + 1
            alerts_payload.append({
                "event": "new_alert",
                "id": str(alert.id),
                "timestamp": alert.timestamp.isoformat(),
                "source_ip": source_ip,
                "destination_ip": destination_ip,
                "category": category,
                "severity": severity,
                "confidence": round(confidence, 4),
                "status": "new",
                "incident_id": str(incident.id),
                "attack_category": category,
            })
            self.emit_console("ALERT", "DETECT", f"{category} detected from {source_ip} ({confidence:.1%})")
            await self.hub.broadcast("logs", {
                "event": "pipeline_log",
                "timestamp": datetime.utcnow().strftime("%H:%M:%S.%f")[:-3],
                "level": "ALERT",
                "source": "DETECT",
                "message": f"{category} detected from {source_ip} ({confidence:.1%})",
            })

        self.total_traffic += len(batch)
        db.commit()

        for payload in alerts_payload:
            await self.hub.broadcast("alerts", payload)

        if incident_ids:
            incidents = db.query(Incident).filter(Incident.id.in_(incident_ids)).all()
            for inc in incidents:
                await self.hub.broadcast("incidents", {
                    "event": "new_incident",
                    "id": str(inc.id),
                    "incident_id": inc.incident_id,
                    "source_ip": (inc.source_ips or "").split(",")[0] if inc.source_ips else None,
                    "source_ips": inc.source_ips,
                    "attack_type": inc.attack_type,
                    "severity": (inc.severity or "medium").lower(),
                    "status": (inc.status or "open").lower(),
                    "created_at": inc.created_at.isoformat(),
                    "updated_at": inc.updated_at.isoformat(),
                    "alert_count": inc.alert_count,
                })
                await self.hub.broadcast("logs", {
                    "event": "pipeline_log",
                    "timestamp": datetime.utcnow().strftime("%H:%M:%S.%f")[:-3],
                    "level": "INFO",
                    "source": "INCIDENT",
                    "message": f"Incident {inc.incident_id or inc.id} updated with alert_count={inc.alert_count}",
                })

        dashboard = self._dashboard_snapshot(db)
        dashboard["event"] = "dashboard_update"
        await self.hub.broadcast("dashboard", dashboard)
        await self.hub.broadcast("logs", {
            "event": "pipeline_log",
            "timestamp": datetime.utcnow().strftime("%H:%M:%S.%f")[:-3],
            "level": "INFO",
            "source": "PIPELINE",
            "message": f"Processed batch size={len(batch)} alerts={len(alerts_payload)}",
        })

        db.close()

    async def run(self):
        self._running = True
        while self._running:
            try:
                await self._run_once()
            except Exception as exc:
                self.emit_console("ALERT", "PIPELINE", f"Streaming error: {exc}")
            await asyncio.sleep(random.choice([1, 2]))

    def start(self):
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self.run())

    def stop(self):
        self._running = False
