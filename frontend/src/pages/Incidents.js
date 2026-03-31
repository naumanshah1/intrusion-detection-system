import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { AlertTriangle, Clock, Shield, Lock, Eye, MessageSquare, Copy, ChevronDown, ChevronUp, Play, PauseCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { api } from "../config";

const SEVERITY_COLORS = { critical: "bg-rose-500/20 text-rose-400", high: "bg-orange-500/20 text-orange-400", medium: "bg-amber-500/20 text-amber-400", low: "bg-cyan-500/20 text-cyan-400" };
const STATUS_COLORS = { open: "bg-blue-500/20 text-blue-400", investigating: "bg-amber-500/20 text-amber-400", contained: "bg-orange-500/20 text-orange-400", resolved: "bg-emerald-500/20 text-emerald-400" };

export default function Incidents() {
  const [searchParams] = useSearchParams();
  const selectedIncidentId = searchParams.get("id");

  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(selectedIncidentId);
  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    fetchIncidents();
  }, []);

  useEffect(() => {
    if (expandedId && incidents.length > 0) {
      fetchIncidentDetails(expandedId);
    }
  }, [expandedId, incidents]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/incidents");
      const incidentsList = Array.isArray(res.data) ? res.data : res.data.incidents || [];
      setIncidents(incidentsList);
      
      if (selectedIncidentId && incidentsList.length > 0) {
        setExpandedId(selectedIncidentId);
      }
    } catch (err) {
      console.error("Error fetching incidents:", err);
      setError("Failed to fetch incidents");
    } finally {
      setLoading(false);
    }
  };

  const fetchIncidentDetails = async (id) => {
    try {
      const res = await api.get(`/incidents/${id}`);
      setSelectedIncident(res.data);
      setActiveTab("details");
    } catch (err) {
      console.error("Error fetching incident details:", err);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/incidents/${id}`, { status: newStatus });
      fetchIncidents();
      if (expandedId === id) {
        fetchIncidentDetails(id);
      }
    } catch (err) {
      console.error("Error updating incident:", err);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !expandedId) return;
    try {
      setCommentLoading(true);
      await api.post(`/incidents/${expandedId}/comments`, { content: comment });
      setComment("");
      fetchIncidentDetails(expandedId);
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleBlockIP = async (id) => {
    try {
      await api.post(`/incidents/${id}/block-ip`);
      alert("Rule created to block source IP");
      fetchIncidentDetails(id);
    } catch (err) {
      console.error("Error blocking IP:", err);
    }
  };

  const handleWhitelistIP = async (id) => {
    try {
      await api.post(`/incidents/${id}/whitelist-ip`, { reason: "False positive" });
      alert("IP whitelisted");
      fetchIncidentDetails(id);
    } catch (err) {
      console.error("Error whitelisting IP:", err);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle size={20} className="text-rose-400" />Incidents
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{incidents.length} total incidents</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Incidents", value: incidents.length, color: "text-foreground" },
          { label: "Open", value: incidents.filter((i) => i.status === "open").length, color: "text-blue-400" },
          { label: "Investigating", value: incidents.filter((i) => i.status === "investigating").length, color: "text-amber-400" },
          { label: "Resolved", value: incidents.filter((i) => i.status === "resolved").length, color: "text-emerald-400" },
        ].map((s) => (
          <Card key={s.label} className="text-center py-3">
            <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {error && <Card className="bg-rose-500/10 border-rose-500/20 p-4 text-sm text-rose-400">{error}</Card>}

      <div className="grid md:grid-cols-3 gap-4">
        {/* Incidents List */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Incidents List</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-2">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : incidents.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No incidents</div>
            ) : (
              incidents.map((incident) => (
                <button
                  key={incident.id}
                  onClick={() => setExpandedId(expandedId === incident.id ? null : incident.id)}
                  className={`w-full text-left p-3 border-l-4 transition-colors ${
                    expandedId === incident.id ? "border-blue-400 bg-blue-500/10" : "border-muted hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-mono text-muted-foreground">{incident.id.substring(0, 8)}</div>
                      <div className="text-xs font-semibold truncate">{incident.attack_type}</div>
                      <div className="text-xs text-muted-foreground mt-1">{incident.source_ips}</div>
                    </div>
                    <Badge className={`text-[10px] whitespace-nowrap ${STATUS_COLORS[incident.status] || ""}`}>
                      {incident.status}
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Incident Details */}
        {selectedIncident && expandedId && (
          <motion.div className="md:col-span-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle size={18} className="text-rose-400" />
                      {selectedIncident.attack_type}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{selectedIncident.id}</p>
                  </div>
                  <Badge className={`text-sm ${SEVERITY_COLORS[selectedIncident.severity] || ""}`}>
                    {selectedIncident.severity}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-accent/50 p-3 rounded">
                    <div className="text-xs text-muted-foreground">Duration</div>
                    <div className="text-sm font-semibold">{selectedIncident.duration_minutes || 0}m</div>
                  </div>
                  <div className="bg-accent/50 p-3 rounded">
                    <div className="text-xs text-muted-foreground">Alerts</div>
                    <div className="text-sm font-semibold">{selectedIncident.linked_alerts?.length || 0}</div>
                  </div>
                  <div className="bg-accent/50 p-3 rounded">
                    <div className="text-xs text-muted-foreground">Comments</div>
                    <div className="text-sm font-semibold">{selectedIncident.comments?.length || 0}</div>
                  </div>
                  <div className="bg-accent/50 p-3 rounded">
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="text-xs font-semibold capitalize">{selectedIncident.status}</div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-border">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`px-3 py-2 text-xs font-semibold border-b-2 transition ${
                      activeTab === "details" ? "border-blue-400 text-blue-400" : "border-transparent text-muted-foreground"
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab("alerts")}
                    className={`px-3 py-2 text-xs font-semibold border-b-2 transition ${
                      activeTab === "alerts" ? "border-blue-400 text-blue-400" : "border-transparent text-muted-foreground"
                    }`}
                  >
                    Alerts ({selectedIncident.linked_alerts?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`px-3 py-2 text-xs font-semibold border-b-2 transition ${
                      activeTab === "comments" ? "border-blue-400 text-blue-400" : "border-transparent text-muted-foreground"
                    }`}
                  >
                    Comments ({selectedIncident.comments?.length || 0})
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === "details" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Created At</label>
                        <div className="mt-1 text-xs">{new Date(selectedIncident.created_at).toLocaleString()}</div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Last Updated</label>
                        <div className="mt-1 text-xs">{new Date(selectedIncident.updated_at).toLocaleString()}</div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase text-muted-foreground">Source IPs</label>
                      <div className="mt-1 font-mono text-sm bg-accent/50 p-2 rounded break-all">{selectedIncident.source_ips}</div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase text-muted-foreground">Attack Type</label>
                      <div className="mt-1 text-sm">{selectedIncident.attack_type}</div>
                    </div>

                    {selectedIncident.notes && (
                      <div>
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Internal Notes</label>
                        <div className="mt-1 text-sm bg-accent/50 p-2 rounded break-words">{selectedIncident.notes}</div>
                      </div>
                    )}

                    {/* Analyst Assignment */}
                    <div className="space-y-2 p-3 bg-accent/30 rounded">
                      <label className="text-xs font-semibold uppercase text-muted-foreground block">Assigned Analyst</label>
                      <div className="text-xs">{selectedIncident.assigned_to || "Unassigned"}</div>
                      <Button size="sm" variant="outline" className="text-xs w-full">
                        👤 Assign to Me
                      </Button>
                    </div>

                    {/* Status Workflow */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase text-muted-foreground">Status Workflow</label>
                      <div className="flex flex-wrap gap-2">
                        {["open", "investigating", "contained", "resolved"].map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant={selectedIncident.status === status ? "default" : "outline"}
                            onClick={() => handleStatusChange(selectedIncident.id, status)}
                            className="text-xs capitalized"
                          >
                            {status === "open" && <Play size={12} className="mr-1" />}
                            {status === "investigating" && <PauseCircle size={12} className="mr-1" />}
                            {status === "contained" && <Shield size={12} className="mr-1" />}
                            {status === "resolved" && <CheckCircle size={12} className="mr-1" />}
                            {status}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Critical Actions */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <label className="text-xs font-semibold uppercase text-muted-foreground">Critical Actions</label>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          className="text-xs w-full bg-rose-600 hover:bg-rose-700"
                          onClick={() => handleBlockIP(selectedIncident.id)}
                        >
                          <Lock size={12} className="mr-1" />🔥 Block All Source IPs
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs w-full"
                          onClick={() => handleWhitelistIP(selectedIncident.id)}
                        >
                          <Shield size={12} className="mr-1" />✓ Mark as False Positive
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs w-full"
                          onClick={() => navigator.clipboard.writeText(selectedIncident.source_ips)}
                        >
                          <Copy size={12} className="mr-1" />Copy All IPs
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "alerts" && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground mb-3">
                      Timeline of {selectedIncident.linked_alerts?.length || 0} linked detections
                    </div>
                    {selectedIncident.linked_alerts && selectedIncident.linked_alerts.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {selectedIncident.linked_alerts.map((alert, idx) => (
                          <div key={alert.id} className="flex gap-3">
                            <div className="text-xs text-muted-foreground pt-1 min-w-fit">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </div>
                            <div className="flex-1 bg-accent/50 p-2 rounded text-xs">
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <div className="font-mono text-muted-foreground">{alert.id.substring(0, 8)}</div>
                                <Badge className={`text-[10px] ${SEVERITY_COLORS[alert.severity] || ""}`}>
                                  {alert.severity}
                                </Badge>
                              </div>
                              <div className="font-semibold">{alert.attack_category || "Unknown"}</div>
                              <div className="text-muted-foreground mt-1">From: {alert.source_ip}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground py-4 text-center">No linked alerts yet</div>
                    )}
                  </div>
                )}

                {activeTab === "comments" && (
                  <div className="space-y-3">
                    {/* Comments List */}
                    <div className="text-xs font-semibold text-muted-foreground mb-3">
                      Analyst Timeline ({selectedIncident.comments?.length || 0} notes)
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedIncident.comments && selectedIncident.comments.length > 0 ? (
                        selectedIncident.comments.map((comment, idx) => (
                          <div key={comment.id} className="bg-accent/30 p-3 rounded text-xs border-l-2 border-blue-500">
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <span className="font-semibold text-blue-400">{comment.created_by}</span>
                              <span className="text-muted-foreground text-[10px] whitespace-nowrap">
                                {new Date(comment.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-foreground leading-relaxed break-words">{comment.content}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-muted-foreground py-4 italic">No notes yet. Add one to start the investigation timeline.</div>
                      )}
                    </div>

                    {/* Add Comment */}
                    <div className="border-t border-border pt-3 space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground">Add Investigation Note</div>
                      <Textarea
                        placeholder="Record your findings or actions taken..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="text-xs"
                        disabled={commentLoading}
                      />
                      <Button
                        size="sm"
                        className="text-xs w-full"
                        onClick={handleAddComment}
                        disabled={!comment.trim() || commentLoading}
                      >
                        <MessageSquare size={12} className="mr-1" />
                        {commentLoading ? "Adding..." : "Add Note"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* No Selection */}
        {!selectedIncident && !expandedId && (
          <Card className="md:col-span-2">
            <CardContent className="p-12 text-center">
              <AlertTriangle size={32} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Select an incident to view details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

