import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, ChevronLeft, Shield, Network, ArrowRight, Activity, Info, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { api } from "../config";
import { SEVERITY_COLORS, CATEGORY_COLORS } from "../lib/ids-data";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Investigation() {
  const [searchParams] = useSearchParams();
  const alertId = searchParams.get("id");
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recentAlerts, setRecentAlerts] = useState([]);

  // Fetch alert detail from backend
  useEffect(() => {
    if (!alertId) {
      // Fetch recent alerts to show cards
      api.get("/alerts").then(res => {
        setRecentAlerts((res.data.alerts || []).slice(0, 6));
      }).catch(() => {});
      return;
    }

    setLoading(true);
    setError("");
    api.get(`/alerts/${alertId}`)
      .then(res => setAlert(res.data))
      .catch(err => {
        setError(err.response?.data?.detail || "Failed to fetch alert");
      })
      .finally(() => setLoading(false));
  }, [alertId]);

  if (!alertId) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Search size={20} className="text-primary" />Investigation Center</h1>
        <p className="text-sm text-muted-foreground">Select an alert from the <Link to="/alerts" className="text-primary hover:underline">Alert Queue</Link> to begin investigation.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {recentAlerts.map((a) => (
            <Link key={a.id} to={`/investigation?id=${a.id}`}>
              <Card className="hover:border-primary/30 transition-colors group cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={`text-[10px] uppercase ${SEVERITY_COLORS[a.severity] || ""}`}>{a.severity}</Badge>
                    <span className="text-[10px] font-mono text-muted-foreground">{String(a.id).substring(0, 8)}</span>
                  </div>
                  <p className="font-semibold text-sm mb-1">{a.attack_category || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground font-mono">{a.source_ip}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading investigation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Button variant="ghost" size="sm" asChild><Link to="/alerts"><ChevronLeft size={14} className="mr-1" />Back to Alerts</Link></Button>
        <Card className="bg-rose-500/10 border-rose-500/20 p-6 text-center">
          <p className="text-rose-400 text-sm">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">This alert may not have feature data stored yet. Try alerts created from the Dashboard's "Run Detection" feature.</p>
        </Card>
      </div>
    );
  }

  if (!alert) return null;

  const features = alert.features || {};
  const featureEntries = Object.entries(features);
  const importantFeatures = featureEntries.filter(([, v]) => v !== 0 && v !== 0.0 && v !== "0").slice(0, 12);
  const chartData = importantFeatures.map(([key, val]) => ({ name: key.replace(/_/g, " ").substring(0, 18), value: typeof val === "number" ? val : 0 }));

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link to="/alerts"><ChevronLeft size={16} /></Link></Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Investigation: Alert #{alert.id}</h1>
            <Badge className={`text-[10px] uppercase ${SEVERITY_COLORS[alert.severity] || ""}`}>{alert.severity}</Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{alert.attack_category || "Unknown"} — {alert.source_ip}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Network size={14} className="text-cyan-400" />Connection Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-16">Source</span><span className="font-mono font-medium">{alert.source_ip || "—"}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><ArrowRight size={12} /></div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-16">Protocol</span><span className="font-mono">{features.protocol_type || "—"}</span></div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-16">Service</span><span className="font-mono">{features.service || "—"}</span></div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-16">Flag</span><span className="font-mono">{features.flag || "—"}</span></div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-16">Duration</span><span className="font-mono">{features.duration ?? "—"}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield size={14} className="text-primary" />Detection</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-20">Category</span><Badge className={`text-[10px] ${CATEGORY_COLORS[alert.attack_category] || ""}`}>{alert.attack_category || "Unknown"}</Badge></div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-20">Severity</span><span className="font-medium">{alert.severity}</span></div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-20">Status</span><span className={`font-medium ${alert.status === "linked" ? "text-emerald-400" : "text-amber-400"}`}>{alert.status}</span></div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-20">Incident</span><span className="font-mono text-muted-foreground">{alert.incident_id || "None"}</span></div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-20">Timestamp</span><span className="font-mono">{new Date(alert.timestamp).toLocaleString()}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity size={14} className="text-amber-400" />Key Features</CardTitle></CardHeader>
          <CardContent className="h-48">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} width={75} />
                  <Tooltip contentStyle={{ background: "#151d2e", border: "1px solid #2a3555", borderRadius: "8px", fontSize: "11px", color: "#e2e5ec" }} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-xs">No feature data — alert was created before feature tracking was enabled</div>
            )}
          </CardContent>
        </Card>
      </div>

      {featureEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Info size={14} className="text-muted-foreground" />All 41 NSL-KDD Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-2 text-xs">
              {featureEntries.map(([key, val]) => (
                <div key={key} className="flex items-center justify-between gap-1 py-1 border-b border-border/30">
                  <span className="text-muted-foreground truncate" title={key}>{key.replace(/_/g, " ")}</span>
                  <span className={`font-mono font-medium ${val !== 0 ? "text-foreground" : "text-muted-foreground/50"}`}>{typeof val === "number" && !Number.isInteger(val) ? val.toFixed(2) : String(val)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}