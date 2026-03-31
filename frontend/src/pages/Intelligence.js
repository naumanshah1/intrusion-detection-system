import React from "react";
import { motion } from "motion/react";
import { Globe, Shield, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { MOCK_ALERTS, CATEGORY_COLORS } from "../lib/ids-data";

const THREAT_INTEL = [
  { ip: "203.0.113.47", country: "CN", reputation: "malicious", attacks: 3, last_seen: "09:14:22", asn: "AS4134 ChinaNet", types: ["DoS", "U2R"] },
  { ip: "198.51.100.22", country: "RU", reputation: "suspicious", attacks: 2, last_seen: "09:12:05", asn: "AS47541 VhoSteel", types: ["R2L"] },
  { ip: "192.0.2.88", country: "KP", reputation: "malicious", attacks: 1, last_seen: "09:08:33", asn: "AS131279 Star JV", types: ["Probe"] },
  { ip: "203.0.113.9", country: "IR", reputation: "malicious", attacks: 1, last_seen: "09:05:11", asn: "AS44244 IrancellTel", types: ["U2R"] },
  { ip: "172.16.0.99", country: "—", reputation: "internal", attacks: 1, last_seen: "08:58:47", asn: "Internal", types: ["DoS"] },
  { ip: "198.51.100.7", country: "BR", reputation: "suspicious", attacks: 1, last_seen: "08:52:18", asn: "AS28573 NET", types: ["R2L"] },
  { ip: "203.0.113.55", country: "UA", reputation: "suspicious", attacks: 1, last_seen: "08:45:00", asn: "AS13249 ITCom", types: ["Probe"] },
  { ip: "192.0.2.201", country: "CN", reputation: "malicious", attacks: 1, last_seen: "08:38:12", asn: "AS4808 ChinaUnicom", types: ["U2R"] },
];

const REPUTATION_STYLES = { malicious: "text-rose-400 bg-rose-400/10 border-rose-400/30", suspicious: "text-amber-400 bg-amber-400/10 border-amber-400/30", internal: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30" };

export default function Intelligence() {
  const categories = {};
  MOCK_ALERTS.forEach((a) => { categories[a.category] = (categories[a.category] || 0) + 1; });

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Globe size={20} className="text-cyan-400" />Threat Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Adversary analysis and IP reputation scoring</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(categories).map(([cat, count]) => (
          <Card key={cat} className="text-center py-3">
            <Badge className={`text-[10px] ${CATEGORY_COLORS[cat]}`}>{cat}</Badge>
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
                  {["IP Address", "Country", "ASN", "Reputation", "Attack Types", "Alerts", "Last Seen"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {THREAT_INTEL.map((t, i) => (
                  <motion.tr key={t.ip} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium">{t.ip}</td>
                    <td className="px-4 py-3 text-xs">{t.country}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.asn}</td>
                    <td className="px-4 py-3"><Badge className={`text-[10px] uppercase ${REPUTATION_STYLES[t.reputation]}`}>{t.reputation}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">{t.types.map((type) => <Badge key={type} className={`text-[10px] ${CATEGORY_COLORS[type]}`}>{type}</Badge>)}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{t.attacks}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{t.last_seen}</td>
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