import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Plus, Trash2, X, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import { api } from "../config";

const TYPE_STYLES = {
  block: "text-rose-400 bg-rose-400/10 border-rose-400/30",
  allow: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  manual: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
  auto: "text-amber-400 bg-amber-400/10 border-amber-400/30",
};

const FIELD_OPTIONS = [
  { value: "src_ip", label: "Source IP" },
  { value: "src_bytes", label: "Source Bytes" },
  { value: "dst_bytes", label: "Dest Bytes" },
  { value: "count", label: "Connection Count" },
  { value: "serror_rate", label: "SYN Error Rate" },
  { value: "num_failed_logins", label: "Failed Logins" },
  { value: "protocol_type", label: "Protocol Type" },
  { value: "service", label: "Service" },
];

const OPERATOR_OPTIONS = ["==", "!=", ">", "<", ">=", "<="];

export default function Rules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [newRule, setNewRule] = useState({ field: "src_ip", operator: "==", value: "", priority: 50 });

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/rules");
      setRules(res.data || []);
    } catch (err) {
      setError("Failed to fetch rules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const handleCreate = async () => {
    if (!newRule.value.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await api.post("/rules", {
        field: newRule.field,
        operator: newRule.operator,
        value: newRule.value,
        priority: newRule.priority,
        automation: "manual",
      });
      setRules(prev => [res.data, ...prev]);
      setShowCreate(false);
      setNewRule({ field: "src_ip", operator: "==", value: "", priority: 50 });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create rule");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (ruleId) => {
    try {
      await api.delete(`/rules/${ruleId}`);
      setRules(prev => prev.filter(r => r.id !== ruleId));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete rule");
    }
  };

  const stats = {
    total: rules.length,
    manual: rules.filter(r => r.automation === "manual").length,
    auto: rules.filter(r => r.automation === "auto").length,
    blocks: rules.filter(r => r.field === "src_ip").length,
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><ShieldCheck size={20} className="text-primary" />Firewall Rules</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage detection and response rules</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? <><X size={14} className="mr-1" />Cancel</> : <><Plus size={14} className="mr-1" />Add Rule</>}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Rules", value: stats.total },
          { label: "Manual", value: stats.manual, color: "text-cyan-400" },
          { label: "Auto (IP Block)", value: stats.auto, color: "text-amber-400" },
          { label: "IP Blocks", value: stats.blocks, color: "text-rose-400" },
        ].map((s) => (
          <Card key={s.label} className="text-center py-3">
            <div className={`text-2xl font-bold font-mono ${s.color || "text-foreground"}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {error && <Card className="bg-rose-500/10 border-rose-500/20 p-4 text-sm text-rose-400 flex items-center gap-2"><AlertTriangle size={14} />{error}</Card>}

      {/* Create Rule Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-primary/20">
              <CardHeader><CardTitle className="text-sm">Create New Rule</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <Select value={newRule.field} onValueChange={(v) => setNewRule(p => ({ ...p, field: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Field" /></SelectTrigger>
                    <SelectContent>
                      {FIELD_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={newRule.operator} onValueChange={(v) => setNewRule(p => ({ ...p, operator: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Operator" /></SelectTrigger>
                    <SelectContent>
                      {OPERATOR_OPTIONS.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input className="text-xs" placeholder="Value (e.g. 192.168.1.100)" value={newRule.value} onChange={e => setNewRule(p => ({ ...p, value: e.target.value }))} />
                  <Button onClick={handleCreate} disabled={creating || !newRule.value.trim()}>
                    {creating ? <Loader2 size={14} className="animate-spin mr-1" /> : <Plus size={14} className="mr-1" />}
                    Create
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground"><Loader2 size={20} className="animate-spin inline mr-2" />Loading rules...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["ID", "Field", "Operator", "Value", "Type", "Priority", "Blocks", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule, i) => (
                    <motion.tr key={rule.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{rule.id}</td>
                      <td className="px-4 py-3 font-mono text-xs">{rule.field}</td>
                      <td className="px-4 py-3 font-mono text-xs text-primary">{rule.operator}</td>
                      <td className="px-4 py-3 font-mono text-xs font-medium">{rule.value}</td>
                      <td className="px-4 py-3"><Badge className={`text-[10px] uppercase ${TYPE_STYLES[rule.automation] || ""}`}>{rule.automation}</Badge></td>
                      <td className="px-4 py-3 font-mono text-xs">{rule.priority}</td>
                      <td className="px-4 py-3 font-mono text-xs font-medium">{rule.simulated_blocks || 0}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(rule.id)}>
                          <Trash2 size={11} />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                  {rules.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">No rules — click "Add Rule" to create one</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}