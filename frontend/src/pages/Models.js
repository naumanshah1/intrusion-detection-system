import React, { useState, useEffect } from "react";
import { Cpu, Circle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { api } from "../config";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

export default function Models() {
  const [models, setModels] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const res = await api.get("/models/metrics");
        const backendModels = res.data.models || [];
        setModels(backendModels);
        setSelected(backendModels[0] || null);
      } catch (err) {
        setError("Backend model metrics unavailable");
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (!selected) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Cpu size={20} className="text-primary" />ML Models</h1>
        <Card className="p-5 text-sm text-muted-foreground">{loading ? "Loading model metrics..." : "No model metrics found."}</Card>
      </div>
    );
  }

  const metricsData = [
    { metric: "Accuracy", value: (selected.accuracy || 0) * 100 },
    { metric: "Precision", value: (selected.precision || 0) * 100 },
    { metric: "Recall", value: (selected.recall || 0) * 100 },
    { metric: "F1 Score", value: (selected.f1_score || 0) * 100 },
  ];

  const fiData = (selected.feature_importance || []).slice(0, 10).map((fi) => ({
    name: fi.feature.replace(/_/g, " ").substring(0, 20),
    importance: +(fi.importance * 100).toFixed(1),
  }));

  const cm = selected.confusion_matrix || [];

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Cpu size={20} className="text-primary" />ML Models</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Model metrics, feature importance, and deployment status</p>
      </div>

      {error && <Card className="bg-amber-500/10 border-amber-500/20 p-3 text-xs text-amber-400 flex items-center gap-2"><AlertTriangle size={12} />{error}</Card>}

      <div className="grid md:grid-cols-3 gap-4">
        {models.map((model) => (
          <Card key={model.id || model.name} onClick={() => setSelected(model)} className={`cursor-pointer transition-all ${selected.id === model.id ? "border-primary/40 bg-primary/5" : "hover:border-border/80"}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge variant={model.is_active ? "default" : "secondary"} className="text-[10px]">
                  <Circle size={5} className={`mr-1 fill-current ${model.is_active ? "text-emerald-400" : "text-muted-foreground"}`} />
                  {model.is_active ? "Active" : "Inactive"}
                </Badge>
                <span className="text-[10px] font-mono text-muted-foreground">{model.id || "model"}</span>
              </div>
              <p className="font-semibold text-sm">{model.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{model.version} • {model.algorithm}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-primary">{((model.accuracy || 0) * 100).toFixed(2)}%</span>
                <span className="text-xs text-muted-foreground">accuracy</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Performance Metrics <Badge variant="outline" className="ml-2 text-[9px]">LIVE</Badge></CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={metricsData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Radar dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Feature Importance (Top 10) <Badge variant="outline" className="ml-2 text-[9px]">LIVE</Badge></CardTitle></CardHeader>
          <CardContent className="h-64">
            {fiData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fiData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} domain={[0, "auto"]} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} width={100} />
                  <Tooltip contentStyle={{ background: "#151d2e", border: "1px solid #2a3555", borderRadius: "8px", fontSize: "11px", color: "#e2e5ec" }} formatter={(v) => `${v}%`} />
                  <Bar dataKey="importance" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No feature importance data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {cm.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Confusion Matrix <Badge variant="outline" className="ml-2 text-[9px]">LIVE</Badge></CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="inline-block">
                <div className="grid grid-cols-3 gap-0 text-xs text-center">
                  <div></div>
                  <div className="py-2 font-semibold text-muted-foreground">Predicted Normal</div>
                  <div className="py-2 font-semibold text-muted-foreground">Predicted Attack</div>
                  <div className="px-4 py-3 font-semibold text-muted-foreground">Actual Normal</div>
                  <div className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-tl-lg font-mono font-bold text-emerald-400">{cm[0]?.[0]?.toLocaleString()}</div>
                  <div className="px-6 py-3 bg-rose-500/10 border border-rose-500/20 rounded-tr-lg font-mono font-bold text-rose-400">{cm[0]?.[1]?.toLocaleString()}</div>
                  <div className="px-4 py-3 font-semibold text-muted-foreground">Actual Attack</div>
                  <div className="px-6 py-3 bg-rose-500/10 border border-rose-500/20 rounded-bl-lg font-mono font-bold text-rose-400">{cm[1]?.[0]?.toLocaleString()}</div>
                  <div className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-br-lg font-mono font-bold text-emerald-400">{cm[1]?.[1]?.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
