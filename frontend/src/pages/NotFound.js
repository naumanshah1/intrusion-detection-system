import React from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "../components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <Shield size={48} className="text-primary/40 mb-6" />
      <h1 className="text-5xl font-bold font-mono text-foreground mb-3">404</h1>
      <p className="text-lg text-muted-foreground mb-8">Page not found — route does not exist in IDS Sentinel.</p>
      <Button asChild size="lg"><Link to="/dashboard">Back to Dashboard</Link></Button>
    </div>
  );
}
