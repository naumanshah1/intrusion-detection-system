import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Terminal, Circle, Pause, Play, Trash2, Download, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { INITIAL_LOGS } from "../lib/ids-data";

const LEVEL_STYLES = {
  ALERT: "text-rose-400", WARN: "text-amber-400", INFO: "text-emerald-400", DEBUG: "text-muted-foreground",
};

const LIVE_MESSAGES = [
  { level: "INFO", source: "PACKET-CAPTURE", message: "Captured 384 packets from interface eth0 in last 1s" },
  { level: "DEBUG", source: "FEATURE-EXT", message: "Extracted 41 KDD features from flow batch #" },
  { level: "INFO", source: "ML-ENGINE", message: "RandomForest v2.3 inference: batch normal traffic" },
  { level: "WARN", source: "NET-MONITOR", message: "Connection rate elevated on port 443: 87/s" },
  { level: "INFO", source: "FIREWALL", message: "Rule RUL-003 matched: 12 ICMP packets filtered" },
  { level: "DEBUG", source: "DB", message: "Log entry written — total records: " },
  { level: "INFO", source: "NET-MONITOR", message: "Interface eth0 throughput: 14.2 Mbps rx / 2.1 Mbps tx" },
  { level: "ALERT", source: "ML-ENGINE", message: "Anomalous pattern detected: investigating..." },
  { level: "INFO", source: "ML-ENGINE", message: "False alarm — pattern resolved as normal traffic" },
  { level: "DEBUG", source: "CONFIG", message: "Health check passed — all systems nominal" },
];

export default function Console() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [isLive, setIsLive] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const scrollRef = useRef(null);
  const batchRef = useRef(8822);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const template = LIVE_MESSAGES[Math.floor(Math.random() * LIVE_MESSAGES.length)];
      batchRef.current += 1;
      const now = new Date();
      const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(now.getMilliseconds()).padStart(3, "0")}`;
      setLogs((prev) => [
        { timestamp: ts, level: template.level, source: template.source, message: template.message + (template.message.endsWith(" ") ? batchRef.current : "") },
        ...prev,
      ].slice(0, 200));
    }, 1800 + Math.random() * 1200);
    return () => clearInterval(interval);
  }, [isLive]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [logs]);

  const filtered = filter === "ALL" ? logs : logs.filter((l) => l.level === filter);

  const handleExport = () => {
    const text = filtered.map((l) => `[${l.timestamp}] [${l.level}] [${l.source}] ${l.message}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `ids_logs_${new Date().toISOString().split("T")[0]}.txt`; link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Terminal size={20} className="text-emerald-400" />Live Console</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} log entries • {isLive ? "streaming" : "paused"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "ALERT", "WARN", "INFO", "DEBUG"].map((level) => (
            <Button key={level} variant={filter === level ? "default" : "secondary"} size="sm" className="text-[10px] h-7 px-2.5" onClick={() => setFilter(level)}>
              {level}
            </Button>
          ))}
          <div className="w-px h-5 bg-border mx-1" />
          <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => setIsLive(!isLive)}>
            {isLive ? <Pause size={12} /> : <Play size={12} />}
          </Button>
          <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => setLogs([])}>
            <Trash2 size={12} />
          </Button>
          <Button variant="secondary" size="icon" className="h-7 w-7" onClick={handleExport}>
            <Download size={12} />
          </Button>
        </div>
      </div>

      <Card className="flex-1 min-h-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-card border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground ml-2">ids-sentinel — real-time logs</span>
          {isLive && <Circle size={6} className="ml-auto fill-emerald-400 text-emerald-400 animate-pulse" />}
        </div>
        <div ref={scrollRef} className="overflow-y-auto h-full p-4 font-mono text-xs space-y-0.5 bg-[#0a0f1a]" style={{ maxHeight: "calc(100vh - 280px)" }}>
          {filtered.map((log, i) => (
            <motion.div key={`${log.timestamp}-${i}`} initial={i === 0 ? { opacity: 0, x: -8 } : false} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}
              className="flex gap-2 py-0.5 hover:bg-white/[0.02] px-1 rounded"
            >
              <span className="text-muted-foreground/50 flex-shrink-0 w-24">{log.timestamp}</span>
              <span className={`flex-shrink-0 w-12 text-right font-bold ${LEVEL_STYLES[log.level] || "text-foreground"}`}>{log.level}</span>
              <span className="text-cyan-400/50 flex-shrink-0 w-28">[{log.source}]</span>
              <span className={`break-all ${log.level === "ALERT" ? "text-rose-300" : "text-foreground/80"}`}>{log.message}</span>
            </motion.div>
          ))}
          {filtered.length === 0 && <div className="text-center text-muted-foreground py-8">No log entries</div>}
        </div>
      </Card>
    </div>
  );
}