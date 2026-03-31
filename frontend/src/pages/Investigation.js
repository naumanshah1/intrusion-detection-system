import React, { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Search, ChevronLeft, Circle, Clock, Shield, Network, ArrowRight, Activity, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { MOCK_ALERTS, SEVERITY_COLORS, CATEGORY_COLORS } from "../lib/ids-data";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Investigation() {
  const [searchParams] = useSearchParams();
  const alertId = searchParams.get("id");
  const alert = useMemo(() => MOCK_ALERTS.find((a) => a.id === alertId), [alertId]);

  if (!alertId || !alert) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Search size={20} className="text-primary" />Investigation Center</h1>
        <p className="text-sm text-muted-foreground">Select an alert from the <Link to="/alerts" className="text-primary hover:underline">Alert Queue</Link> to begin investigation.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {MOCK_ALERTS.filter((a) => a.status === "new").slice(0, 6).map((a) => (
            <Link key={a.id} to={`/investigation?id=${a.id}`}>
              <Card className="hover:border-primary/30 transition-colors group cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={`text-[10px] uppercase ${SEVERITY_COLORS[a.severity]}`}>{a.severity}</Badge>
                    <span className="text-[10px] font-mono text-muted-foreground">{a.id}</span>
                  </div>
                  <p className="font-semibold text-sm mb-1">{a.prediction}</p>
                  <p className="text-xs text-muted-foreground font-mono">{a.src_ip} → {a.dst_ip}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const features = alert.features || {};
  const featureEntries = Object.entries(features);
  const importantFeatures = featureEntries.filter(([, v]) => v !== 0 && v !== 0.0).slice(0, 12);
  const chartData = importantFeatures.map(([key, val]) => ({ name: key.replace(/_/g, " ").substring(0, 18), value: typeof val === "number" ? val : 0 }));

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link to="/alerts"><ChevronLeft size={16} /></Link></Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Investigation: {alert.id}</h1>
            <Badge className={`text-[10px] uppercase ${SEVERITY_COLORS[alert.severity]}`}>{alert.severity}</Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{alert.prediction} — {alert.category}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Network size={14} className="text-cyan-400" />Connection Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-16">Source</span><span className="font-mono font-medium">{alert.src_ip}:{alert.src_port}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><ArrowRight size={12} /></div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-16">Dest</span><span className="font-mono font-medium">{alert.dst_ip}:{alert.dst_port}</span></div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-16">Protocol</span><span className="font-mono">{features.protocol_type || "—"}</span></div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-16">Service</span><span className="font-mono">{features.service || "—"}</span></div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-16">Flag</span><span className="font-mono">{features.flag || "—"}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield size={14} className="text-primary" />Detection</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-20">Attack Type</span><Badge className={`text-[10px] ${CATEGORY_COLORS[alert.category]}`}>{alert.prediction}</Badge></div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-20">Category</span><span className="font-medium">{alert.category}</span></div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-20">Confidence</span><span className="font-mono font-bold text-primary">{(alert.confidence * 100).toFixed(1)}%</span></div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-20">Model</span><span className="font-mono text-muted-foreground">{alert.model}</span></div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground w-20">Status</span><span className={`font-medium ${alert.status === "new" ? "text-rose-400" : alert.status === "investigating" ? "text-amber-400" : "text-emerald-400"}`}>{alert.status}</span></div>
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
              <div className="flex items-center justify-center h-full text-muted-foreground text-xs">No non-zero features</div>
            )}
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}