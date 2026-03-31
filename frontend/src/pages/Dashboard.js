import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Shield, TrendingUp, AlertTriangle, Activity, BarChart2, ArrowUpRight, Circle, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { DASHBOARD_STATS, MOCK_ALERTS, TRAFFIC_TIMELINE, ATTACK_DISTRIBUTION } from "../lib/ids-data";
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

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
  const [stats, setStats] = useState(DASHBOARD_STATS);
  const recentAlerts = MOCK_ALERTS.filter((a) => a.status === "new").slice(0, 5);

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
        <StatCard icon={<AlertTriangle size={18} className="text-rose-400" />} label="Alerts Today" value={stats.alerts_today} color="bg-rose-400/10 border border-rose-400/20" suffix={`(${stats.critical_alerts} critical)`} />
        <StatCard icon={<Shield size={18} className="text-primary" />} label="Model Accuracy" value={`${stats.model_confidence}%`} color="bg-primary/10 border border-primary/20" />
        <StatCard icon={<TrendingUp size={18} className="text-cyan-400" />} label="Malicious Hits" value={stats.malicious_hits} color="bg-cyan-400/10 border border-cyan-400/20" suffix="blocked" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><BarChart2 size={14} className="text-primary" />Traffic Timeline (24h)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TRAFFIC_TIMELINE}>
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
                <Pie data={ATTACK_DISTRIBUTION} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="value">
                  {ATTACK_DISTRIBUTION.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#151d2e", border: "1px solid #2a3555", borderRadius: "8px", fontSize: "12px", color: "#e2e5ec" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
              {ATTACK_DISTRIBUTION.map((cat) => (
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
          <CardTitle className="text-base flex items-center gap-2"><AlertTriangle size={14} className="text-rose-400" />Recent Alerts</CardTitle>
          <Button variant="ghost" size="sm" asChild><Link to="/alerts">View all <ChevronRight size={12} className="ml-1" /></Link></Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alert</th>
                  <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Severity</th>
                  <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source IP</th>
                  <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {recentAlerts.map((alert) => (
                  <tr key={alert.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-3">
                      <Link to={`/investigation?id=${alert.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                        <span className="font-mono text-xs text-muted-foreground">{alert.id}</span>
                        <span className="font-medium">{alert.prediction}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"} className="text-[10px] uppercase">{alert.severity}</Badge>
                    </td>
                    <td className="px-5 py-3"><Badge variant="outline" className="text-[10px]">{alert.category}</Badge></td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{alert.src_ip}</td>
                    <td className="px-5 py-3 font-mono text-xs">{(alert.confidence * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}