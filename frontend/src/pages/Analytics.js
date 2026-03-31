import React, { useState } from "react";
import { motion } from "motion/react";
import { TrendingUp, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import { TRAFFIC_TIMELINE, ATTACK_DISTRIBUTION, MOCK_ALERTS } from "../lib/ids-data";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

export default function Analytics() {
  const [period, setPeriod] = useState("24h");

  const severityData = [
    { name: "Critical", value: MOCK_ALERTS.filter((a) => a.severity === "critical").length, color: "#f43f5e" },
    { name: "High", value: MOCK_ALERTS.filter((a) => a.severity === "high").length, color: "#f97316" },
    { name: "Medium", value: MOCK_ALERTS.filter((a) => a.severity === "medium").length, color: "#fbbf24" },
  ];

  const statusData = [
    { name: "New", value: MOCK_ALERTS.filter((a) => a.status === "new").length, color: "#f43f5e" },
    { name: "Investigating", value: MOCK_ALERTS.filter((a) => a.status === "investigating").length, color: "#fbbf24" },
    { name: "Resolved", value: MOCK_ALERTS.filter((a) => a.status === "resolved").length, color: "#10b981" },
    { name: "False Positive", value: MOCK_ALERTS.filter((a) => a.status === "false_positive").length, color: "#64748b" },
  ];

  const modelData = [
    { name: "RandomForest", value: MOCK_ALERTS.filter((a) => a.model?.includes("Random")).length, color: "#10b981" },
    { name: "XGBoost", value: MOCK_ALERTS.filter((a) => a.model?.includes("XGBoost")).length, color: "#22d3ee" },
  ];

  const handleExport = () => {
    const header = "ID,Severity,Attack,Category,Source IP,Dest IP,Confidence,Status,Timestamp";
    const rows = MOCK_ALERTS.map((a) => `${a.id},${a.severity},${a.prediction},${a.category},${a.src_ip},${a.dst_ip},${a.confidence},${a.status},${a.timestamp}`);
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `ids_alerts_${new Date().toISOString().split("T")[0]}.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><TrendingUp size={20} className="text-primary" />Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Security posture and detection insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7d</SelectItem>
              <SelectItem value="30d">Last 30d</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" size="sm" onClick={handleExport}><Download size={13} className="mr-1" />Export CSV</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Traffic & Threat Timeline</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={TRAFFIC_TIMELINE}>
              <defs>
                <linearGradient id="ng" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} /><stop offset="95%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} /><stop offset="95%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip contentStyle={{ background: "#151d2e", border: "1px solid #2a3555", borderRadius: "8px", fontSize: "12px", color: "#e2e5ec" }} />
              <Legend />
              <Area type="monotone" dataKey="normal" stroke="#10b981" fill="url(#ng)" strokeWidth={2} name="Normal" />
              <Area type="monotone" dataKey="dos" stroke="#f43f5e" fill="url(#dg)" strokeWidth={2} name="DoS" />
              <Area type="monotone" dataKey="probe" stroke="#22d3ee" fill="url(#pg)" strokeWidth={2} name="Probe" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Attack Categories", data: ATTACK_DISTRIBUTION },
          { title: "Alert Severity", data: severityData },
          { title: "Alert Status", data: statusData },
        ].map(({ title, data }) => (
          <Card key={title}>
            <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
            <CardContent className="h-48 flex flex-col items-center">
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value">
                    {data.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#151d2e", border: "1px solid #2a3555", borderRadius: "8px", fontSize: "11px", color: "#e2e5ec" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-[10px]">
                {data.map((d) => (
                  <span key={d.name} className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />{d.name} ({d.value})</span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Model Performance</CardTitle></CardHeader>
        <CardContent className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={modelData}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip contentStyle={{ background: "#151d2e", border: "1px solid #2a3555", borderRadius: "8px", fontSize: "12px", color: "#e2e5ec" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                {modelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}