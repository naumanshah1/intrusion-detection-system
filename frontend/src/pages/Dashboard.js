import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Shield, TrendingUp, AlertTriangle, Activity, BarChart2, ArrowUpRight, Clock, ChevronRight, Play, Zap, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import API_URL, { api } from "../config";
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const PRESETS = {
  dos_neptune: { label: "DoS — Neptune SYN Flood", features: { duration: 0, protocol_type: "tcp", service: "http", flag: "S0", src_bytes: 0, dst_bytes: 0, land: 0, wrong_fragment: 0, urgent: 0, hot: 0, num_failed_logins: 0, logged_in: 0, num_compromised: 0, root_shell: 0, su_attempted: 0, num_root: 0, num_file_creations: 0, num_shells: 0, num_access_files: 0, num_outbound_cmds: 0, is_host_login: 0, is_guest_login: 0, count: 511, srv_count: 511, serror_rate: 1.0, srv_serror_rate: 1.0, rerror_rate: 0.0, srv_rerror_rate: 0.0, same_srv_rate: 1.0, diff_srv_rate: 0.0, srv_diff_host_rate: 0.0, dst_host_count: 255, dst_host_srv_count: 255, dst_host_same_srv_rate: 1.0, dst_host_diff_srv_rate: 0.0, dst_host_same_src_port_rate: 0.01, dst_host_srv_diff_host_rate: 0.0, dst_host_serror_rate: 1.0, dst_host_srv_serror_rate: 1.0, dst_host_rerror_rate: 0.0, dst_host_srv_rerror_rate: 0.0 } },
  normal_http: { label: "Normal — HTTP Browse", features: { duration: 0, protocol_type: "tcp", service: "http", flag: "SF", src_bytes: 181, dst_bytes: 5450, land: 0, wrong_fragment: 0, urgent: 0, hot: 0, num_failed_logins: 0, logged_in: 1, num_compromised: 0, root_shell: 0, su_attempted: 0, num_root: 0, num_file_creations: 0, num_shells: 0, num_access_files: 0, num_outbound_cmds: 0, is_host_login: 0, is_guest_login: 0, count: 8, srv_count: 8, serror_rate: 0.0, srv_serror_rate: 0.0, rerror_rate: 0.0, srv_rerror_rate: 0.0, same_srv_rate: 1.0, diff_srv_rate: 0.0, srv_diff_host_rate: 0.0, dst_host_count: 9, dst_host_srv_count: 9, dst_host_same_srv_rate: 1.0, dst_host_diff_srv_rate: 0.0, dst_host_same_src_port_rate: 0.11, dst_host_srv_diff_host_rate: 0.0, dst_host_serror_rate: 0.0, dst_host_srv_serror_rate: 0.0, dst_host_rerror_rate: 0.0, dst_host_srv_rerror_rate: 0.0 } },
  probe_portsweep: { label: "Probe — Port Sweep", features: { duration: 0, protocol_type: "tcp", service: "private", flag: "REJ", src_bytes: 0, dst_bytes: 0, land: 0, wrong_fragment: 0, urgent: 0, hot: 0, num_failed_logins: 0, logged_in: 0, num_compromised: 0, root_shell: 0, su_attempted: 0, num_root: 0, num_file_creations: 0, num_shells: 0, num_access_files: 0, num_outbound_cmds: 0, is_host_login: 0, is_guest_login: 0, count: 36, srv_count: 1, serror_rate: 0.0, srv_serror_rate: 0.0, rerror_rate: 1.0, srv_rerror_rate: 1.0, same_srv_rate: 0.03, diff_srv_rate: 0.97, srv_diff_host_rate: 0.0, dst_host_count: 255, dst_host_srv_count: 18, dst_host_same_srv_rate: 0.07, dst_host_diff_srv_rate: 0.93, dst_host_same_src_port_rate: 0.04, dst_host_srv_diff_host_rate: 0.0, dst_host_serror_rate: 0.0, dst_host_srv_serror_rate: 0.0, dst_host_rerror_rate: 0.98, dst_host_srv_rerror_rate: 0.96 } },
  u2r_rootkit: { label: "U2R — Rootkit Attempt", features: { duration: 0, protocol_type: "tcp", service: "telnet", flag: "SF", src_bytes: 146, dst_bytes: 8223, land: 0, wrong_fragment: 0, urgent: 0, hot: 2, num_failed_logins: 0, logged_in: 1, num_compromised: 0, root_shell: 1, su_attempted: 0, num_root: 0, num_file_creations: 0, num_shells: 1, num_access_files: 0, num_outbound_cmds: 0, is_host_login: 0, is_guest_login: 0, count: 1, srv_count: 1, serror_rate: 0.0, srv_serror_rate: 0.0, rerror_rate: 0.0, srv_rerror_rate: 0.0, same_srv_rate: 1.0, diff_srv_rate: 0.0, srv_diff_host_rate: 0.0, dst_host_count: 3, dst_host_srv_count: 3, dst_host_same_srv_rate: 1.0, dst_host_diff_srv_rate: 0.0, dst_host_same_src_port_rate: 0.33, dst_host_srv_diff_host_rate: 0.0, dst_host_serror_rate: 0.0, dst_host_srv_serror_rate: 0.0, dst_host_rerror_rate: 0.0, dst_host_srv_rerror_rate: 0.0 } },
};

function StatCard({ icon, label, value, suffix, trend, color }) {
  return (
    <Card className="relative overflow-hidden group hover:border-primary/20 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</span>
              {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
            </div>
          </div>
          {trend && <span className="text-xs font-medium text-emerald-400 flex items-center gap-0.5"><ArrowUpRight size={12} />{trend}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({ total_traffic: 0, alerts_today: 0, critical_alerts: 0, model_confidence: 0, malicious_hits: 0, active_incidents: 0 });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [trafficTimeline, setTrafficTimeline] = useState([]);
  const [attackDistribution, setAttackDistribution] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState("dos_neptune");
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const [dashboardRes, alertsRes] = await Promise.all([
        api.get("/dashboard"),
        api.get("/alerts"),
      ]);
      const d = dashboardRes.data || {};
      const alerts = alertsRes.data.alerts || [];
      const distribution = d.attack_distribution || {};

      setStats({
        total_traffic: d.total_traffic || 0,
        alerts_today: d.total_alerts || alerts.length,
        critical_alerts: alerts.filter((a) => a.severity === "critical").length,
        model_confidence: 99.27,
        malicious_hits: d.total_alerts || alerts.length,
        active_incidents: d.active_incidents || 0,
      });

      setTrafficTimeline(d.timeline || []);
      setAttackDistribution([
        { name: "DoS", value: distribution.DoS || 0, color: "#f43f5e" },
        { name: "Probe", value: distribution.Probe || 0, color: "#22d3ee" },
        { name: "R2L", value: distribution.R2L || 0, color: "#fbbf24" },
        { name: "U2R", value: distribution.U2R || 0, color: "#a78bfa" },
      ]);
      setRecentAlerts(alerts.slice(0, 5));
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const wsUrl = API_URL.replace("http://", "ws://").replace("https://", "wss://");
    const ws = new WebSocket(`${wsUrl}/ws/dashboard`);

    ws.onmessage = (event) => {
      try {
        const d = JSON.parse(event.data);
        const distribution = d.attack_distribution || {};
        setStats((prev) => ({
          ...prev,
          total_traffic: d.total_traffic || prev.total_traffic,
          alerts_today: d.total_alerts || prev.alerts_today,
          malicious_hits: d.total_alerts || prev.malicious_hits,
          active_incidents: d.active_incidents || prev.active_incidents,
        }));
        setTrafficTimeline(d.timeline || []);
        setAttackDistribution([
          { name: "DoS", value: distribution.DoS || 0, color: "#f43f5e" },
          { name: "Probe", value: distribution.Probe || 0, color: "#22d3ee" },
          { name: "R2L", value: distribution.R2L || 0, color: "#fbbf24" },
          { name: "U2R", value: distribution.U2R || 0, color: "#a78bfa" },
        ]);
      } catch (e) {
        // no-op
      }
    };

    return () => ws.close();
  }, [fetchStats]);

  const handleRunDetection = async () => {
    setDetecting(true);
    setResult(null);
    try {
      const payload = { features: PRESETS[selectedPreset].features };
      const res = await api.post("/predict/detect", payload);
      setResult(res.data);
      fetchStats(); // refresh stats
    } catch (err) {
      setResult({ error: err.response?.data?.detail || err.message });
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time threat detection and network intelligence</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={12} /><span>Last updated: just now</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Activity size={18} className="text-emerald-400" />} label="Total Traffic" value={stats.total_traffic} color="bg-emerald-400/10 border border-emerald-400/20" trend="+12%" />
        <StatCard icon={<AlertTriangle size={18} className="text-rose-400" />} label="Attacks Detected" value={stats.alerts_today} color="bg-rose-400/10 border border-rose-400/20" suffix={`(${stats.critical_alerts} critical)`} />
        <StatCard icon={<Shield size={18} className="text-primary" />} label="Model Accuracy" value={`${stats.model_confidence}%`} color="bg-primary/10 border border-primary/20" />
        <StatCard icon={<TrendingUp size={18} className="text-cyan-400" />} label="Malicious Hits" value={stats.malicious_hits} color="bg-cyan-400/10 border border-cyan-400/20" suffix="flagged" />
      </div>

      {/* Run Detection Panel */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Zap size={14} className="text-amber-400" />Run Detection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedPreset} onValueChange={setSelectedPreset}>
              <SelectTrigger className="sm:w-72 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PRESETS).map(([key, p]) => (
                  <SelectItem key={key} value={key}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleRunDetection} disabled={detecting} className="gap-2">
              <Play size={14} />
              {detecting ? "Analyzing..." : "Run Inference"}
            </Button>
          </div>
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {result.error ? (
                  <div className="flex items-center gap-2 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                    <XCircle size={16} /> {result.error}
                  </div>
                ) : (
                  <div className={`flex items-center gap-4 p-4 rounded-lg border ${result.prediction === "attack" ? "bg-rose-500/10 border-rose-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}>
                    {result.prediction === "attack" ? <AlertTriangle size={20} className="text-rose-400" /> : <CheckCircle2 size={20} className="text-emerald-400" />}
                    <div className="flex-1">
                      <p className={`font-bold text-sm ${result.prediction === "attack" ? "text-rose-400" : "text-emerald-400"}`}>
                        {result.prediction === "attack" ? `THREAT DETECTED — ${result.attack_category}` : "NORMAL TRAFFIC"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Confidence: {(result.confidence * 100).toFixed(1)}% • Severity: {result.severity}
                      </p>
                    </div>
                    <Badge className={`uppercase text-[10px] ${result.prediction === "attack" ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                      {result.prediction}
                    </Badge>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><BarChart2 size={14} className="text-primary" />Traffic Timeline (24h)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficTimeline}>
                <defs>
                  <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dosGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#151d2e", border: "1px solid #2a3555", borderRadius: "8px", fontSize: "12px", color: "#e2e5ec" }} />
                <Area type="monotone" dataKey="normal" stroke="#10b981" fill="url(#normalGrad)" strokeWidth={2} name="Normal" />
                <Area type="monotone" dataKey="dos" stroke="#f43f5e" fill="url(#dosGrad)" strokeWidth={2} name="DoS" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attack Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={attackDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="value">
                  {attackDistribution.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#151d2e", border: "1px solid #2a3555", borderRadius: "8px", fontSize: "12px", color: "#e2e5ec" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
              {attackDistribution.map((cat) => (
                <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-muted-foreground">{cat.name}</span>
                  <span className="font-mono font-medium text-foreground">{cat.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><AlertTriangle size={14} className="text-rose-400" />Recent Alerts (Live)</CardTitle>
          <Button variant="ghost" size="sm" asChild><Link to="/alerts">View all <ChevronRight size={12} className="ml-1" /></Link></Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
                  <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Severity</th>
                  <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source IP</th>
                  <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentAlerts.map((alert) => (
                  <tr key={alert.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-3">
                      <Link to={`/investigation?id=${alert.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                        <span className="font-mono text-xs text-muted-foreground">{String(alert.id).substring(0, 8)}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"} className="text-[10px] uppercase">{alert.severity}</Badge>
                    </td>
                    <td className="px-5 py-3"><Badge variant="outline" className="text-[10px]">{alert.attack_category || "Unknown"}</Badge></td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{alert.source_ip}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(alert.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
                {recentAlerts.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground text-sm">No alerts yet — run a detection above</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}