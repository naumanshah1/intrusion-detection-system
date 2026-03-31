import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView } from "motion/react";
import { Shield, Zap, BarChart2, Lock, Globe, Cpu, ChevronRight, Circle, Terminal as TerminalIcon, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";

const TERMINAL_LINES = [
  { text: "> IDS Sentinel v3.1.0 initializing...", color: "text-emerald-400", delay: 0 },
  { text: "> Loading RandomForest model (99.27% accuracy)...", color: "text-cyan-400", delay: 0.4 },
  { text: "> Binding to interface eth0 — capturing packets...", color: "text-foreground/70", delay: 0.8 },
  { text: "[ALERT] DoS/neptune detected: 203.0.113.47 → 10.0.0.1 (conf: 97.2%)", color: "text-rose-400", delay: 1.2 },
  { text: "> Rule RUL-001 applied: blocking 14,821 malicious packets...", color: "text-amber-400", delay: 1.6 },
  { text: "[ALERT] Probe/ipsweep detected: 192.0.2.88 — port sweep in progress", color: "text-rose-400", delay: 2.0 },
  { text: "> Analysis complete — 12 threats neutralized in 2.3s", color: "text-emerald-400", delay: 2.4 },
  { text: "> System status: PROTECTED ■■■■■■■■■■ 100%", color: "text-emerald-400", delay: 2.8 },
];

function TerminalAnimation() {
  const [visibleLines, setVisibleLines] = useState(0);
  useEffect(() => {
    const timers = TERMINAL_LINES.map((line, i) => setTimeout(() => setVisibleLines(i + 1), line.delay * 1000 + 500));
    return () => timers.forEach(clearTimeout);
  }, []);
  return (
    <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/50">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-card border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <span className="text-xs font-mono text-muted-foreground ml-2">ids-sentinel — live detection</span>
        <Circle size={6} className="ml-auto fill-emerald-400 text-emerald-400 animate-pulse" />
      </div>
      <div className="p-5 font-mono text-xs space-y-1.5 min-h-[220px]">
        {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className={line.color}>{line.text}</motion.div>
        ))}
        {visibleLines < TERMINAL_LINES.length && (
          <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity }} className="inline-block w-2 h-4 bg-primary ml-0.5 align-middle" />
        )}
      </div>
    </div>
  );
}

function StatCard({ value, label, suffix = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    const step = value / (1500 / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, value);
      setCount(Math.floor(current));
      if (current >= value) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, value]);
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-foreground tabular-nums">{count.toLocaleString()}{suffix}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

const FEATURES = [
  { icon: <Cpu size={20} className="text-primary" />, title: "ML-Powered Detection", description: "Random Forest & XGBoost models trained on NSL-KDD achieve 99.27% accuracy across DoS, Probe, R2L, and U2R attack categories." },
  { icon: <Zap size={20} className="text-cyan-400" />, title: "Real-Time Monitoring", description: "Packet capture and feature extraction happen at wire speed. Threats are flagged within milliseconds using 41 NSL-KDD features." },
  { icon: <Globe size={20} className="text-amber-400" />, title: "Enterprise Scalability", description: "Designed for high-throughput environments. Process 125,000+ packets per session with full audit trails and rule management." },
  { icon: <BarChart2 size={20} className="text-purple-400" />, title: "Security Posture Analytics", description: "Visualize attack distributions, traffic anomaly spikes, and threat intelligence in an interactive security dashboard." },
  { icon: <Lock size={20} className="text-rose-400" />, title: "Automated Response", description: "Automatically generate firewall rules when threats are detected. Block malicious IPs and subnets with one click." },
  { icon: <TerminalIcon size={20} className="text-emerald-400" />, title: "Live Console", description: "A real-time monospaced log stream gives you full visibility into every detection event, model inference, and system action." },
];

export default function Index() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center"><Shield size={14} className="text-primary" /></div>
          <span className="font-bold text-sm tracking-tight">IDS Sentinel</span>
        </div>
        <div className="flex items-center gap-3">
          {token ? (
            <Button size="sm" onClick={() => navigate("/dashboard")}>Open Dashboard <ArrowRight size={14} className="ml-1" /></Button>
          ) : (
            <Button size="sm" onClick={() => navigate("/login")}>Sign In</Button>
          )}
        </div>
      </nav>

      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(16,185,129,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.8) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-destructive/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary mb-8">
              <Circle size={6} className="fill-primary text-primary animate-pulse" /> 99.27% Detection Accuracy on NSL-KDD Benchmark
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">AI Intrusion Detection<br /><span className="text-primary">Built for the Modern Threat</span></h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">Enterprise-grade network intrusion detection powered by Random Forest and XGBoost models. Real-time classification of DoS, Probe, R2L, and U2R attacks.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {token ? (
                <Button size="lg" className="text-base px-8" onClick={() => navigate("/dashboard")}>Open Dashboard <ChevronRight size={16} className="ml-1" /></Button>
              ) : (
                <Button size="lg" className="text-base px-8" onClick={() => navigate("/login")}>Get Started <ChevronRight size={16} className="ml-1" /></Button>
              )}
              <Button asChild variant="secondary" size="lg" className="text-base px-8"><Link to="/login">View Analytics</Link></Button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="mt-16 max-w-2xl mx-auto">
            <TerminalAnimation />
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 border-y border-border bg-card/30">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {[{ value: 9927, label: "Detection Accuracy", suffix: "/100" }, { value: 125973, label: "Packets Analyzed" }, { value: 10709, label: "Threats Blocked" }, { value: 41, label: "NSL-KDD Features" }].map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Stay Protected</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">A complete security operations platform — from packet capture to ML inference to automated response.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-card/80 transition-all duration-200 group">
                <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center mb-4 group-hover:border-primary/30 transition-colors">{feature.icon}</div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-card/20 border-y border-border">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Detects All NSL-KDD Attack Categories</h2>
            <p className="text-muted-foreground">Trained on 125,000+ labeled network connections</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "DoS", name: "Denial of Service", examples: "Neptune, Smurf, Teardrop", color: "text-rose-400 border-rose-400/20 bg-rose-400/5" },
              { label: "Probe", name: "Reconnaissance", examples: "Portsweep, Ipsweep, Nmap", color: "text-cyan-400 border-cyan-400/20 bg-cyan-400/5" },
              { label: "R2L", name: "Remote to Local", examples: "FTP Write, Guess Passwd", color: "text-amber-400 border-amber-400/20 bg-amber-400/5" },
              { label: "U2R", name: "User to Root", examples: "Buffer Overflow, Rootkit", color: "text-purple-400 border-purple-400/20 bg-purple-400/5" },
            ].map((cat, i) => (
              <motion.div key={cat.label} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className={`rounded-xl p-5 border text-center ${cat.color}`}>
                <div className="text-2xl font-bold font-mono mb-1">{cat.label}</div>
                <div className="text-xs font-semibold mb-2">{cat.name}</div>
                <div className="text-[10px] opacity-70">{cat.examples}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative z-10 max-w-2xl mx-auto">
          <Shield size={40} className="text-primary mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Secure Your Network?</h2>
          <p className="text-muted-foreground text-lg mb-8">Launch the dashboard and start monitoring live traffic with enterprise-grade ML detection.</p>
          <Button size="lg" className="text-base px-10" onClick={() => navigate(token ? "/dashboard" : "/login")}>Open Dashboard <ChevronRight size={16} className="ml-1" /></Button>
        </motion.div>
      </section>

      <footer className="border-t border-border py-8 px-6 text-center text-xs text-muted-foreground">
        <p>IDS Sentinel &copy; {new Date().getFullYear()} — Built on NSL-KDD dataset. Random Forest & XGBoost classifiers.</p>
      </footer>
    </div>
  );
}
