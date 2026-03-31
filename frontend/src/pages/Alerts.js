import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { AlertTriangle, Search, Filter, ChevronRight, Circle, Clock, Eye, Link2, Plus, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import { api } from "../config";

const STATUS_LABELS = { unlinked: "Unlinked", linked: "Linked", acknowledged: "Acknowledged", false_positive: "False Positive" };
const SEVERITY_COLORS = { critical: "bg-rose-500/20 text-rose-400", high: "bg-orange-500/20 text-orange-400", medium: "bg-amber-500/20 text-amber-400", low: "bg-cyan-500/20 text-cyan-400" };
const CATEGORY_COLORS = { DoS: "bg-red-500/20 text-red-400", Probe: "bg-yellow-500/20 text-yellow-400", R2L: "bg-purple-500/20 text-purple-400", U2R: "bg-pink-500/20 text-pink-400" };

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState("all");
  const [linkFilter, setLinkFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [newAlertIds, setNewAlertIds] = useState(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [creatingIncident, setCreatingIncident] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (sevFilter !== "all") params.append("severity", sevFilter);
      if (linkFilter !== "all") params.append("linked", linkFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      
      const res = await api.get(`/alerts?${params.toString()}`);
      const newAlerts = res.data.alerts || [];
      
      // Track new alerts (for highlighting)
      const existingIds = new Set(alerts.map(a => a.id));
      const incomingIds = new Set(newAlerts.map(a => a.id));
      const newIds = [...incomingIds].filter(id => !existingIds.has(id));
      
      setNewAlertIds(new Set(newIds));
      setAlerts(newAlerts);
      
      // Clear highlight after 2 seconds
      if (newIds.length > 0) {
        setTimeout(() => setNewAlertIds(new Set()), 2000);
      }
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError("Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 3 seconds
  useEffect(() => {
    fetchAlerts();
    
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchAlerts();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [sevFilter, linkFilter, statusFilter, autoRefresh]);

  const handleCreateIncident = async (alert) => {
    try {
      setCreatingIncident(alert.id);
      const res = await api.post("/incidents", {
        source_ips: alert.source_ip,
        attack_type: alert.attack_category || "Unknown",
        severity: alert.severity
      });
      
      // Link the alert to the new incident
      await api.post(`/alerts/${alert.id}/link-incident`, {
        incident_id: res.data.id
      });
      
      alert("Incident created! Alert linked.");
      fetchAlerts();
    } catch (err) {
      console.error("Error creating incident:", err);
      alert("Failed to create incident");
    } finally {
      setCreatingIncident(null);
    }
  };

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (search) {
        const q = search.toLowerCase();
        return (
          a.id.toLowerCase().includes(q) ||
          (a.attack_category || "").toLowerCase().includes(q) ||
          a.source_ip?.includes(q)
        );
      }
      return true;
    });
  }, [search, alerts]);

  const counts = {
    all: alerts.length,
    critical: alerts.filter((a) => a.severity === "critical").length,
    high: alerts.filter((a) => a.severity === "high").length,
    medium: alerts.filter((a) => a.severity === "medium").length,
    linked: alerts.filter((a) => a.incident_id).length,
    unlinked: alerts.filter((a) => !a.incident_id).length
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><AlertTriangle size={20} className="text-rose-400" />Alert Queue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} alerts matching filters</p>
        </div>
        <Button 
          size="sm" 
          variant={autoRefresh ? "default" : "outline"}
          onClick={() => setAutoRefresh(!autoRefresh)}
          className="text-xs"
        >
          <RefreshCw size={12} className="mr-1" />
          {autoRefresh ? "Live" : "Paused"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Alerts", value: counts.all, color: "text-foreground" },
          { label: "Critical", value: counts.critical, color: "text-rose-400" },
          { label: "High", value: counts.high, color: "text-orange-400" },
          { label: "Linked", value: counts.linked, color: "text-emerald-400" },
          { label: "Unlinked", value: counts.unlinked, color: "text-amber-400" },
        ].map((s) => (
          <Card key={s.label} className="text-center py-3">
            <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {error && <Card className="bg-rose-500/10 border-rose-500/20 p-4 text-sm text-rose-400">{error}</Card>}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="relative flex-1 w-full md:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9 h-8 text-xs" placeholder="Search ID, category, IP..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={sevFilter} onValueChange={setSevFilter}>
                <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="Severity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={linkFilter} onValueChange={setLinkFilter}>
                <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="Incident" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="linked">Linked</SelectItem>
                  <SelectItem value="unlinked">Unlinked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Alert Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Alert Status</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="false_positive">False Positive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading alerts...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["ID", "Severity", "Category", "Source IP", "Status", "Incident", "Time", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((alert, i) => (
                    <motion.tr 
                      key={alert.id} 
                      initial={{ opacity: 0, x: -8 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: i * 0.03 }}
                      className={`border-b border-border/50 transition-colors ${
                        newAlertIds.has(alert.id) 
                          ? "bg-emerald-500/10 animate-pulse" 
                          : "hover:bg-accent/30"
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{String(alert.id).substring(0, 8)}</td>
                      <td className="px-4 py-3"><Badge className={`text-[10px] uppercase ${SEVERITY_COLORS[alert.severity] || ""}`}>{alert.severity}</Badge></td>
                      <td className="px-4 py-3"><Badge className={`text-[10px] ${CATEGORY_COLORS[alert.attack_category] || ""}`}>{alert.attack_category || "Unknown"}</Badge></td>
                      <td className="px-4 py-3 font-mono text-xs">{alert.source_ip}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-[10px] ${alert.incident_id ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                          {alert.incident_id ? "Linked" : "Unlinked"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {alert.incident_id ? (
                          <Link to={`/incidents?id=${alert.incident_id}`} className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 hover:text-emerald-300 underline">
                            <Link2 size={12} /> {String(alert.incident_id).substring(0, 8)}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(alert.timestamp).toLocaleTimeString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {!alert.incident_id && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleCreateIncident(alert)}
                              disabled={creatingIncident === alert.id}
                              title="Create new incident from this alert"
                            >
                              <Plus size={12} />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            asChild 
                            title="View investigation"
                          >
                            <Link to={`/investigation?id=${alert.id}`}><Eye size={12} /></Link>
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">No alerts matching filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}