import React, { useState, useEffect, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Bell, Menu, ChevronRight, Circle, LogOut, WifiOff } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { api } from "../../config";
import API_URL from "../../config";

const ROUTE_LABELS = {
  "/dashboard": "Dashboard", "/alerts": "Alerts", "/investigation": "Investigation",
  "/analytics": "Analytics", "/intelligence": "Intelligence", "/rules": "Rules",
  "/models": "Models", "/explorer": "Explorer", "/console": "Console",
  "/incidents": "Incidents", "/pipeline": "Pipeline", "/config": "Config",
  "/reports": "Reports", "/apihub": "API Hub", "/audit": "Audit Logs",
};

export default function TopNav({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pageLabel = ROUTE_LABELS[location.pathname] ?? "IDS Sentinel";
  const [systemStatus, setSystemStatus] = useState("checking");
  const [alerts, setAlerts] = useState([]);
  const [toasts, setToasts] = useState([]);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Check backend health
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data.status === "online" ? "online" : "degraded");
      } else {
        setSystemStatus("offline");
        addToast("Backend returned error status", "error");
      }
    } catch (err) {
      setSystemStatus("offline");
      addToast("Backend is unreachable", "error");
    }
  }, []);

  // Fetch real alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.get("/alerts?severity=critical");
      setAlerts((res.data.alerts || []).slice(0, 5));
    } catch (err) {
      // Don't spam toasts for auth errors
    }
  }, []);

  useEffect(() => {
    checkHealth();
    fetchAlerts();
    const interval = setInterval(() => {
      checkHealth();
      fetchAlerts();
    }, 15000);
    return () => clearInterval(interval);
  }, [checkHealth, fetchAlerts]);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const statusConfig = {
    online: { color: "bg-emerald-400/10 border-emerald-400/20 text-emerald-400", dotClass: "fill-emerald-400 text-emerald-400", label: "ONLINE" },
    degraded: { color: "bg-amber-400/10 border-amber-400/20 text-amber-400", dotClass: "fill-amber-400 text-amber-400", label: "DEGRADED" },
    offline: { color: "bg-rose-400/10 border-rose-400/20 text-rose-400", dotClass: "fill-rose-400 text-rose-400", label: "OFFLINE" },
    checking: { color: "bg-muted/50 border-border text-muted-foreground", dotClass: "fill-muted-foreground text-muted-foreground", label: "..." },
  };

  const status = statusConfig[systemStatus] || statusConfig.checking;

  return (
    <>
      <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-card/60 backdrop-blur-sm flex-shrink-0">
        <button onClick={onMenuClick} className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"><Menu size={20} /></button>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/dashboard" className="hover:text-foreground transition-colors font-medium">IDS Sentinel</Link>
          <ChevronRight size={12} />
          <span className="text-foreground font-semibold">{pageLabel}</span>
        </div>
        <div className="flex-1" />
        
        {/* System Status */}
        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono ${status.color}`}>
          {systemStatus === "offline" ? <WifiOff size={10} /> : <Circle size={6} className={`${status.dotClass} ${systemStatus === "online" ? "animate-pulse" : ""}`} />}
          <span>{status.label}</span>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell size={16} />
              {alerts.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-white text-[9px] font-bold rounded-full flex items-center justify-center">{alerts.length}</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-3 py-2 border-b border-border"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Critical Alerts (Live)</p></div>
            {alerts.length > 0 ? alerts.slice(0, 4).map((alert) => (
              <DropdownMenuItem key={alert.id} asChild>
                <Link to={`/investigation?id=${alert.id}`} className="flex flex-col items-start gap-0.5 py-2">
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-xs font-bold uppercase text-rose-400">CRITICAL</span>
                    <span className="text-xs font-mono text-muted-foreground ml-auto">{String(alert.id).substring(0, 8)}</span>
                  </div>
                  <p className="text-xs text-foreground font-medium">{alert.attack_category || "Unknown"} — {alert.source_ip}</p>
                </Link>
              </DropdownMenuItem>
            )) : (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">No critical alerts</div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/alerts" className="text-xs text-center w-full text-primary font-medium justify-center">View all alerts →</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                  {(user.username || "U")[0].toUpperCase()}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{user.username || "Analyst"}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role || "user"}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive"><LogOut size={13} className="mr-2" /> Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" onClick={() => navigate("/")} variant="secondary">Sign In</Button>
        )}
      </header>

      {/* Toast Notifications */}
      <div className="fixed top-16 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`px-4 py-3 rounded-lg border text-sm font-medium shadow-lg animate-in slide-in-from-right ${
            toast.type === "error" ? "bg-rose-500/10 border-rose-400/30 text-rose-400" : "bg-primary/10 border-primary/30 text-primary"
          }`}>
            {toast.message}
          </div>
        ))}
      </div>
    </>
  );
}
