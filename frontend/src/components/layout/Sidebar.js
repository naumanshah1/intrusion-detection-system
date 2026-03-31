import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";
import {
  LayoutDashboard, Bell, Search, TrendingUp, Globe,
  ShieldCheck, Cpu, FolderOpen, Terminal, Shield,
  ChevronLeft, ChevronRight, X, AlertCircle, Zap, Settings, FileText, Key, Lock,
} from "lucide-react";

const NAV_SECTIONS = [
  { title: "Overview", items: [{ label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={16} /> }] },
  { title: "Detection", items: [
    { label: "Alerts", href: "/alerts", icon: <Bell size={16} /> },
    { label: "Incidents", href: "/incidents", icon: <AlertCircle size={16} /> },
    { label: "Investigation", href: "/investigation", icon: <Search size={16} /> },
  ]},
  { title: "Analysis", items: [
    { label: "Analytics", href: "/analytics", icon: <TrendingUp size={16} /> },
    { label: "Intelligence", href: "/intelligence", icon: <Globe size={16} /> },
  ]},
  { title: "Management", items: [
    { label: "Rules", href: "/rules", icon: <ShieldCheck size={16} /> },
    { label: "Models", href: "/models", icon: <Cpu size={16} /> },
  ]},
  { title: "Data", items: [
    { label: "Explorer", href: "/explorer", icon: <FolderOpen size={16} /> },
    { label: "Pipeline", href: "/pipeline", icon: <Zap size={16} /> },
    { label: "Console", href: "/console", icon: <Terminal size={16} /> },
  ]},
  { title: "Admin", items: [
    { label: "Config", href: "/config", icon: <Settings size={16} /> },
    { label: "Reports", href: "/reports", icon: <FileText size={16} /> },
    { label: "API Hub", href: "/apihub", icon: <Key size={16} /> },
    { label: "Audit Logs", href: "/audit", icon: <Lock size={16} /> },
  ]},
];

export default function Sidebar({ isMobileOpen, onMobileClose, isCollapsed, onToggleCollapse }) {
  const location = useLocation();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Shield size={16} className="text-primary" />
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="whitespace-nowrap">
                <p className="text-sm font-bold tracking-tight text-sidebar-foreground">IDS Sentinel</p>
                <p className="text-[10px] text-primary font-mono uppercase tracking-widest">v3.1.0 Active</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={onMobileClose} className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"><X size={16} /></button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-1">
                  {section.title}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.href || (item.href === "/investigation" && location.pathname.startsWith("/investigation"));
                return (
                  <NavLink key={item.href} to={item.href} onClick={onMobileClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative",
                      isCollapsed ? "justify-center" : "",
                      isActive ? "bg-primary/15 text-primary border border-primary/20" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                    title={isCollapsed ? item.label : undefined}>
                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />}
                    <span className={cn("flex-shrink-0 transition-colors", isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground")}>{item.icon}</span>
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden whitespace-nowrap">
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="hidden lg:flex border-t border-sidebar-border p-2">
        <button onClick={onToggleCollapse} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors text-xs">
          {isCollapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <motion.aside animate={{ width: isCollapsed ? 60 : 240 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="hidden lg:flex flex-col h-full bg-sidebar border-r border-sidebar-border flex-shrink-0 overflow-hidden">
        {sidebarContent}
      </motion.aside>
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onMobileClose} />
            <motion.aside initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="fixed left-0 top-0 z-50 h-full w-60 bg-sidebar border-r border-sidebar-border lg:hidden">
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
