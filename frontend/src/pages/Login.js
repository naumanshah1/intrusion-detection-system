import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import API_URL from "../config";

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint = isLogin ? "/login" : "/signup";
      const body = JSON.stringify({ username, password });
      const headers = { "Content-Type": "application/json" };

      const res = await fetch(`${API_URL}${endpoint}`, { method: "POST", headers, body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Authentication failed");

      if (isLogin) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify({ username, role: data.role || "user" }));
        navigate("/dashboard");
      } else {
        setIsLogin(true);
        setError("");
        alert("Account created! Please sign in.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(16,185,129,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.8) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center mb-4">
            <Shield size={22} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">IDS Sentinel</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? "Sign in to your security dashboard" : "Create a new analyst account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-xl border border-border bg-card/80 backdrop-blur-sm">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" autoFocus required />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
            <div className="relative">
              <Input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
            {isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-5">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLogin(!isLogin); setError(""); }} className="text-primary hover:underline font-medium">
            {isLogin ? "Register" : "Sign In"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
