import React, { useState } from "react";
import { motion } from "motion/react";
import { Cpu, Circle, Star, BarChart2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { MOCK_MODELS } from "../lib/ids-data";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

export default function Models() {
  const [selected, setSelected] = useState(MOCK_MODELS[0]);

  const metricsData = [
    { metric: "Accuracy", value: selected.accuracy * 100 },
    { metric: "Precision", value: selected.precision * 100 },
    { metric: "Recall", value: selected.recall * 100 },
    { metric: "F1 Score", value: selected.f1_score * 100 },
  ];

  const fiData = (selected.feature_importance || []).slice(0, 10).map((fi) => ({
    name: fi.feature.replace(/_/g, " ").substring(0, 20),
    importance: +(fi.importance * 100).toFixed(1),
  }));

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Cpu size={20} className="text-primary" />ML Models</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Model versioning, metrics, and deployment status</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {MOCK_MODELS.map((model) => (
          <Card key={model.id} onClick={() => setSelected(model)} className={`cursor-pointer transition-all ${selected.id === model.id ? "border-primary/40 bg-primary/5" : "hover:border-border/80"}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge variant={model.is_active ? "default" : "secondary"} className="text-[10px]">
                  <Circle size={5} className={`mr-1 fill-current ${model.is_active ? "text-emerald-400" : "text-muted-foreground"}`} />
                  {model.is_active ? "Active" : "Inactive"}
                </Badge>
                <span className="text-[10px] font-mono text-muted-foreground">{model.id}</span>
              </div>
              <p className="font-semibold text-sm">{model.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{model.version} • {model.algorithm}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-primary">{(model.accuracy * 100).toFixed(2)}%</span>
                <span className="text-xs text-muted-foreground">accuracy</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Performance Metrics</CardTitle></CardHeader>
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
          <CardHeader><CardTitle className="text-sm">Feature Importance (Top 10)</CardTitle></CardHeader>
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

      <Card>
        <CardHeader><CardTitle className="text-sm">Model Details — {selected.name} {selected.version}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {[
              { label: "Algorithm", value: selected.algorithm },
              { label: "Trained On", value: new Date(selected.trained_on).toLocaleDateString() },
              { label: "Deployed", value: new Date(selected.deployed_at).toLocaleDateString() },
              { label: "Status", value: selected.is_active ? "Active" : "Inactive" },
              { label: "Accuracy", value: `${(selected.accuracy * 100).toFixed(2)}%` },
              { label: "Precision", value: `${(selected.precision * 100).toFixed(2)}%` },
              { label: "Recall", value: `${(selected.recall * 100).toFixed(2)}%` },
              { label: "F1 Score", value: `${(selected.f1_score * 100).toFixed(2)}%` },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-muted-foreground mb-0.5">{item.label}</p>
                <p className="font-mono font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}