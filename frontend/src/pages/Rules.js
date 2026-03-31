import React, { useState } from "react";
import { motion } from "motion/react";
import { ShieldCheck, Plus, Pencil, Trash2, Circle, Power } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { MOCK_RULES } from "../lib/ids-data";

const TYPE_STYLES = { block: "text-rose-400 bg-rose-400/10 border-rose-400/30", allow: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30", whitelist: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30" };

export default function Rules() {
  const [rules, setRules] = useState(MOCK_RULES);

  const toggleRule = (id) => setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  const deleteRule = (id) => setRules((prev) => prev.filter((r) => r.id !== id));

  const stats = { total: rules.length, active: rules.filter((r) => r.enabled).length, block: rules.filter((r) => r.type === "block").length, totalHits: rules.reduce((s, r) => s + r.hits, 0) };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><ShieldCheck size={20} className="text-primary" />Firewall Rules</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage detection and response rules</p>
        </div>
        <Button size="sm"><Plus size={14} className="mr-1" />Add Rule</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Rules", value: stats.total },
          { label: "Active", value: stats.active, color: "text-emerald-400" },
          { label: "Block Rules", value: stats.block, color: "text-rose-400" },
          { label: "Total Hits", value: stats.totalHits.toLocaleString() },
        ].map((s) => (
          <Card key={s.label} className="text-center py-3">
            <div className={`text-2xl font-bold font-mono ${s.color || "text-foreground"}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Status", "ID", "Name", "Type", "Source IP", "Protocol", "Port", "Hits", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, i) => (
                  <motion.tr key={rule.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className={`border-b border-border/50 hover:bg-accent/30 transition-colors ${!rule.enabled ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <button onClick={() => toggleRule(rule.id)} title={rule.enabled ? "Disable" : "Enable"}>
                        <Circle size={8} className={rule.enabled ? "fill-emerald-400 text-emerald-400" : "fill-muted-foreground text-muted-foreground"} />
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{rule.id}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-xs">{rule.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{rule.description}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge className={`text-[10px] uppercase ${TYPE_STYLES[rule.type]}`}>{rule.type}</Badge></td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{rule.src_ip || "any"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{rule.protocol || "any"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{rule.port || "any"}</td>
                    <td className="px-4 py-3 font-mono text-xs font-medium">{rule.hits.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleRule(rule.id)}><Power size={11} /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteRule(rule.id)}><Trash2 size={11} /></Button>
                      </div>
                    </td>
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