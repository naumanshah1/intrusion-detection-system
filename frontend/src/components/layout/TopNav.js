import React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Bell, Menu, ChevronRight, Circle, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { MOCK_ALERTS } from "../../lib/ids-data";

const ROUTE_LABELS = {
  "/dashboard": "Dashboard", "/alerts": "Alerts", "/investigation": "Investigation",
  "/analytics": "Analytics", "/intelligence": "Intelligence", "/rules": "Rules",
  "/models": "Models", "/explorer": "Explorer", "/console": "Console",
};

export default function TopNav({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pageLabel = ROUTE_LABELS[location.pathname] ?? "IDS Sentinel";
  const newAlerts = MOCK_ALERTS.filter((a) => a.status === "new");
  const criticalAlerts = newAlerts.filter((a) => a.severity === "critical");

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-card/60 backdrop-blur-sm flex-shrink-0">
      <button onClick={onMenuClick} className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"><Menu size={20} /></button>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/dashboard" className="hover:text-foreground transition-colors font-medium">IDS Sentinel</Link>
        <ChevronRight size={12} />
        <span className="text-foreground font-semibold">{pageLabel}</span>
      </div>
      <div className="flex-1" />
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-xs font-mono text-emerald-400">
        <Circle size={6} className="fill-emerald-400 text-emerald-400 animate-pulse" />
        <span>ONLINE</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-8 w-8">
            <Bell size={16} />
            {criticalAlerts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-white text-[9px] font-bold rounded-full flex items-center justify-center">{criticalAlerts.length}</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="px-3 py-2 border-b border-border"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Alerts</p></div>
          {newAlerts.slice(0, 4).map((alert) => (
            <DropdownMenuItem key={alert.id} asChild>
              <Link to={`/investigation?id=${alert.id}`} className="flex flex-col items-start gap-0.5 py-2">
                <div className="flex items-center gap-2 w-full">
                  <span className={`text-xs font-bold uppercase ${alert.severity === "critical" ? "text-rose-400" : "text-amber-400"}`}>{alert.severity.toUpperCase()}</span>
                  <span className="text-xs font-mono text-muted-foreground ml-auto">{alert.id}</span>
                </div>
                <p className="text-xs text-foreground font-medium">{alert.prediction} — {alert.src_ip}</p>
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/alerts" className="text-xs text-center w-full text-primary font-medium justify-center">View all alerts →</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
  );
}
