import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Globe, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { api } from "../config";
import { CATEGORY_COLORS } from "../lib/ids-data";

const REPUTATION_STYLES = {
  malicious: "text-rose-400 bg-rose-400/10 border-rose-400/30",
  suspicious: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  internal: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
};

export default function Intelligence() {
  const [alerts, setAlerts] = useState([]);
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [alertsRes, intelRes] = await Promise.all([api.get("/alerts"), api.get("/threat-intel")]);
        setAlerts(alertsRes.data.alerts || []);
        setFeed(intelRes.data.items || []);
      } catch (e) {
        // no-op
      }
    };
    load();
  }, []);

  const categories = useMemo(() => {
    const result = {};
    alerts.forEach((a) => {
      const key = a.attack_category || "Unknown";
      result[key] = (result[key] || 0) + 1;
    });
    return result;
  }, [alerts]);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Globe size={20} className="text-cyan-400" />Threat Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Adversary analysis and IP reputation scoring</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(categories).map(([cat, count]) => (
          <Card key={cat} className="text-center py-3">
            <Badge className={`text-[10px] ${CATEGORY_COLORS[cat] || ""}`}>{cat}</Badge>
            <div className="text-2xl font-bold font-mono mt-1">{count}</div>
            <div className="text-[10px] text-muted-foreground">alerts</div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Shield size={14} className="text-amber-400" />IP Reputation Feed</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["IP Address", "Reputation", "Threat Score", "Alerts", "Last Seen"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {feed.map((t, i) => (
                  <motion.tr key={t.source_ip} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium">{t.source_ip}</td>
                    <td className="px-4 py-3"><Badge className={`text-[10px] uppercase ${REPUTATION_STYLES[t.label] || ""}`}>{t.label}</Badge></td>
                    <td className="px-4 py-3 font-mono text-xs">{t.score}</td>
                    <td className="px-4 py-3 font-mono text-xs">{t.attacks}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{t.last_seen ? new Date(t.last_seen).toLocaleTimeString() : "-"}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
