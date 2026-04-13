import React, { useState, useEffect, useMemo } from "react";
import { TrendingUp, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import API_URL, { api } from "../config";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

export default function Analytics() {
  const [period, setPeriod] = useState("24h");
  const [alerts, setAlerts] = useState([]);
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [alertsRes, dashboardRes] = await Promise.all([api.get("/alerts"), api.get("/dashboard")]);
        setAlerts(alertsRes.data.alerts || []);
        setTimeline(dashboardRes.data.timeline || []);
      } catch (e) {
        // no-op
      }
    };
    load();

    const wsUrl = API_URL.replace("http://", "ws://").replace("https://", "wss://");
    const ws = new WebSocket(`${wsUrl}/ws/dashboard`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setTimeline(data.timeline || []);
      } catch (e) {
        // no-op
      }
    };
    return () => ws.close();
  }, []);

  const attackDistribution = useMemo(() => {
    const counts = { DoS: 0, Probe: 0, R2L: 0, U2R: 0 };
    alerts.forEach((a) => {
      if (counts[a.attack_category] !== undefined) counts[a.attack_category] += 1;
    });
    return [
      { name: "DoS", value: counts.DoS, color: "#f43f5e" },
      { name: "Probe", value: counts.Probe, color: "#22d3ee" },
      { name: "R2L", value: counts.R2L, color: "#fbbf24" },
      { name: "U2R", value: counts.U2R, color: "#a78bfa" },
    ];
  }, [alerts]);

  const severityData = useMemo(() => {
    return ["critical", "high", "medium", "low"].map((level, i) => ({
      name: level[0].toUpperCase() + level.slice(1),
      value: alerts.filter((a) => a.severity === level).length,
      color: ["#f43f5e", "#f97316", "#fbbf24", "#22d3ee"][i],
    }));
  }, [alerts]);

  const statusData = useMemo(() => {
    const keys = ["new", "investigating", "resolved", "false_positive", "linked", "unlinked"];
    return keys.map((k) => ({
      name: k,
      value: alerts.filter((a) => (a.status || "").toLowerCase() === k).length,
      color: "#64748b",
    })).filter((x) => x.value > 0);
  }, [alerts]);

  const modelData = [
    { name: "RandomForest", value: alerts.length, color: "#10b981" },
    { name: "Hybrid", value: Math.max(1, Math.floor(alerts.length * 0.7)), color: "#22d3ee" },
  ];

  const handleExport = () => {
    const header = "ID,Severity,Category,Source IP,Destination IP,Confidence,Status,Timestamp";
    const rows = alerts.map((a) => `${a.id},${a.severity},${a.attack_category},${a.source_ip},${a.destination_ip || ""},${a.confidence || ""},${a.status},${a.timestamp}`);
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ids_alerts_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
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
            <AreaChart data={timeline}>
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
          { title: "Attack Categories", data: attackDistribution },
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
        <CardHeader><CardTitle className="text-base">Model Throughput</CardTitle></CardHeader>
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
