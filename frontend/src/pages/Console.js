import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Terminal, Circle, Pause, Play, Trash2, Download, Wifi, WifiOff } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import API_URL from "../config";

const LEVEL_STYLES = {
  ALERT: "text-rose-400", WARN: "text-amber-400", INFO: "text-emerald-400", DEBUG: "text-muted-foreground",
};

export default function Console() {
  const [logs, setLogs] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [wsConnected, setWsConnected] = useState(false);
  const scrollRef = useRef(null);
  const wsRef = useRef(null);

  // Connect to WebSocket for real-time log updates
  const connectWebSocket = useCallback(() => {
    if (!isLive) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const wsUrl = API_URL.replace("http://", "ws://").replace("https://", "wss://");
      const ws = new WebSocket(`${wsUrl}/ws/logs`);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.message) {
            setLogs((prev) => [
              {
                timestamp: data.timestamp,
                level: data.level || "INFO",
                source: data.source || "PIPELINE",
                message: data.message,
              },
              ...prev,
            ].slice(0, 300));
          }
        } catch (e) {
          // ignore
        }
      };
    } catch (e) {
      console.error("WebSocket connection failed:", e);
    }
  }, [isLive]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWebSocket]);

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
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} log entries • {isLive ? "streaming" : "paused"} •{" "}
            <span className={wsConnected ? "text-emerald-400" : "text-rose-400"}>
              {wsConnected ? "connected" : "disconnected"}
            </span>
          </p>
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
          <div className="ml-auto flex items-center gap-1.5">
            {wsConnected ? <Wifi size={10} className="text-emerald-400" /> : <WifiOff size={10} className="text-rose-400" />}
            {isLive && <Circle size={6} className="fill-emerald-400 text-emerald-400 animate-pulse" />}
          </div>
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