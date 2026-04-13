import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FolderOpen, Search, Database, HardDrive, Upload, FileText, AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { api } from "../config";

export default function Explorer() {
  const [datasets, setDatasets] = useState([]);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const filteredDS = datasets.filter((ds) => {
    if (!search) return true;
    return ds.name.toLowerCase().includes(search.toLowerCase());
  });

  const fetchDatasets = useCallback(async () => {
    try {
      const res = await api.get("/datasets");
      setDatasets(res.data.datasets || []);
    } catch (err) {
      // no-op
    }
  }, []);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const handleUpload = useCallback(async (file) => {
    if (!file) return;
    
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv", "txt"].includes(ext)) {
      setError("Unsupported file type. Use .csv or .txt (KDD format)");
      return;
    }

    setUploading(true);
    setUploadResult(null);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><FolderOpen size={20} className="text-primary" />Data Explorer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Upload datasets and run bulk inference</p>
        </div>
        <Button size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload size={14} className="mr-1" />Upload File
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" accept=".csv,.txt" onChange={handleFileSelect} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Datasets", value: datasets.length, icon: <Database size={14} className="text-primary" /> },
          { label: "Total Records", value: "Live stream", icon: <HardDrive size={14} className="text-cyan-400" /> },
          { label: "Total Size", value: `${datasets.reduce((s, d) => s + (d.size_mb || 0), 0).toFixed(1)} MB`, icon: <FolderOpen size={14} className="text-amber-400" /> },
          { label: "Uploads", value: uploadResult ? 1 : 0, icon: <Upload size={14} className="text-emerald-400" /> },
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

      {error && (
        <Card className="bg-rose-500/10 border-rose-500/20 p-4 text-sm text-rose-400 flex items-center justify-between">
          <span className="flex items-center gap-2"><AlertTriangle size={14} />{error}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setError("")}><X size={12} /></Button>
        </Card>
      )}

      {/* Drag & Drop Upload Zone */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-8 text-center">
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-primary" />
              <p className="text-sm font-medium">Uploading & running inference...</p>
              <p className="text-xs text-muted-foreground">Processing your data through the ML pipeline</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Upload size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Drop a CSV or KDD file here</p>
                <p className="text-xs text-muted-foreground mt-1">Supports .csv and .txt (NSL-KDD format) • Max 100MB</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Results */}
      <AnimatePresence>
        {uploadResult && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText size={14} className="text-primary" />
                  Inference Results — {uploadResult.filename}
                  <Badge variant="outline" className="ml-2 text-[9px]">{uploadResult.total_rows} rows</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-card border border-border">
                    <div className="text-2xl font-bold font-mono">{uploadResult.total_rows}</div>
                    <div className="text-[10px] text-muted-foreground">Total Rows</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-2xl font-bold font-mono text-emerald-400">{uploadResult.normal}</div>
                    <div className="text-[10px] text-muted-foreground">Normal</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <div className="text-2xl font-bold font-mono text-rose-400">{uploadResult.attacks}</div>
                    <div className="text-[10px] text-muted-foreground">Attacks</div>
                  </div>
                </div>

                {/* Attack Rate Bar */}
                <div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Normal: {((uploadResult.normal / uploadResult.total_rows) * 100).toFixed(1)}%</span>
                    <span>Attack: {((uploadResult.attacks / uploadResult.total_rows) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-400/60 rounded-l-full" style={{ width: `${(uploadResult.normal / uploadResult.total_rows) * 100}%` }} />
                    <div className="h-full bg-rose-400/60 rounded-r-full" style={{ width: `${(uploadResult.attacks / uploadResult.total_rows) * 100}%` }} />
                  </div>
                </div>

                {/* Results Table */}
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b border-border">
                        {["Row", "Prediction", "Confidence", "Protocol", "Service", "Src Bytes", "Dst Bytes"].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(uploadResult.results || []).slice(0, 100).map((r, i) => (
                        <tr key={i} className="border-b border-border/30 hover:bg-accent/20">
                          <td className="px-3 py-1.5 font-mono text-muted-foreground">{r.row}</td>
                          <td className="px-3 py-1.5">
                            <Badge className={`text-[9px] uppercase ${r.prediction === "attack" ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                              {r.prediction === "attack" ? <AlertTriangle size={8} className="mr-0.5" /> : <CheckCircle2 size={8} className="mr-0.5" />}
                              {r.prediction}
                            </Badge>
                          </td>
                          <td className="px-3 py-1.5 font-mono">{(r.confidence * 100).toFixed(1)}%</td>
                          <td className="px-3 py-1.5 font-mono text-muted-foreground">{r.protocol}</td>
                          <td className="px-3 py-1.5 font-mono text-muted-foreground">{r.service}</td>
                          <td className="px-3 py-1.5 font-mono">{r.src_bytes?.toLocaleString()}</td>
                          <td className="px-3 py-1.5 font-mono">{r.dst_bytes?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Datasets */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9 h-8 text-xs" placeholder="Search datasets..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filteredDS.map((ds, i) => (
          <motion.div key={ds.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="hover:border-primary/30 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] uppercase ${ds.type === "train" ? "text-primary bg-primary/10" : ds.type === "test" ? "text-cyan-400 bg-cyan-400/10" : "text-purple-400 bg-purple-400/10"}`}>{ds.type}</Badge>
                    <Badge className={`text-[10px] uppercase ${ds.status === "ready" ? "text-emerald-400 bg-emerald-400/10" : "text-amber-400 bg-amber-400/10"}`}>{ds.status}</Badge>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{ds.type?.toUpperCase()}</span>
                </div>
                <p className="font-semibold text-sm font-mono mb-2">{ds.name}</p>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div><span className="text-muted-foreground">Records</span><p className="font-mono font-medium">Streaming</p></div>
                  <div><span className="text-muted-foreground">Size</span><p className="font-mono font-medium">{ds.size_mb} MB</p></div>
                  <div><span className="text-muted-foreground">Uploaded</span><p className="font-mono font-medium">{new Date(ds.uploaded_at).toLocaleDateString()}</p></div>
                </div>
                <div className="mt-3 text-[10px] text-muted-foreground">Ready for continuous streaming inference</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}