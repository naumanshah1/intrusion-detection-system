import React, { useState } from "react";
import { motion } from "motion/react";
import { FolderOpen, Search, Database, HardDrive, Circle, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { MOCK_DATASETS, MOCK_ALERTS } from "../lib/ids-data";

const STATUS_STYLES = { ready: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30", processing: "text-amber-400 bg-amber-400/10 border-amber-400/30" };
const TYPE_STYLES = { train: "text-primary bg-primary/10 border-primary/30", test: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30", live: "text-purple-400 bg-purple-400/10 border-purple-400/30" };

export default function Explorer() {
  const [search, setSearch] = useState("");
  const [selectedDS, setSelectedDS] = useState(null);

  const filteredDS = MOCK_DATASETS.filter((ds) => {
    if (!search) return true;
    return ds.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><FolderOpen size={20} className="text-primary" />Data Explorer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Browse datasets and network captures</p>
        </div>
        <Button size="sm"><Upload size={14} className="mr-1" />Upload</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Datasets", value: MOCK_DATASETS.length, icon: <Database size={14} className="text-primary" /> },
          { label: "Total Records", value: MOCK_DATASETS.reduce((s, d) => s + d.records, 0).toLocaleString(), icon: <HardDrive size={14} className="text-cyan-400" /> },
          { label: "Total Size", value: `${MOCK_DATASETS.reduce((s, d) => s + d.size_mb, 0).toFixed(1)} MB`, icon: <FolderOpen size={14} className="text-amber-400" /> },
          { label: "Processing", value: MOCK_DATASETS.filter((d) => d.status === "processing").length, icon: <Circle size={14} className="text-amber-400 animate-pulse" /> },
        ].map((s) => (
          <Card key={s.label} className="py-3">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center">{s.icon}</div>
              <div>
                <div className="text-lg font-bold font-mono">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9 h-8 text-xs" placeholder="Search datasets..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filteredDS.map((ds, i) => (
          <motion.div key={ds.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={`cursor-pointer hover:border-primary/30 transition-all ${selectedDS?.id === ds.id ? "border-primary/40 bg-primary/5" : ""}`} onClick={() => setSelectedDS(ds)}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] uppercase ${TYPE_STYLES[ds.type]}`}>{ds.type}</Badge>
                    <Badge className={`text-[10px] uppercase ${STATUS_STYLES[ds.status]}`}>{ds.status}</Badge>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{ds.id}</span>
                </div>
                <p className="font-semibold text-sm font-mono mb-2">{ds.name}</p>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div><span className="text-muted-foreground">Records</span><p className="font-mono font-medium">{ds.records.toLocaleString()}</p></div>
                  <div><span className="text-muted-foreground">Size</span><p className="font-mono font-medium">{ds.size_mb} MB</p></div>
                  <div><span className="text-muted-foreground">Uploaded</span><p className="font-mono font-medium">{new Date(ds.uploaded_at).toLocaleDateString()}</p></div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Normal: {ds.normal_pct}%</span><span>Attack: {ds.attack_pct}%</span>
                  </div>
                  <div className="h-1.5 bg-background rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-400/60 rounded-l-full" style={{ width: `${ds.normal_pct}%` }} />
                    <div className="h-full bg-rose-400/60 rounded-r-full" style={{ width: `${ds.attack_pct}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}