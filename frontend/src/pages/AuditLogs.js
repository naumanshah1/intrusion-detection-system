import { useState, useEffect } from "react";
import { api } from "../config";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get("/audit-logs");
        setLogs(response.data);
      } catch (err) {
        console.error("Failed to fetch audit logs");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) return <div className="p-6 text-white text-center">Loading Security Audits...</div>;

  return (
    <div className="p-8 min-h-screen bg-gray-900 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400 drop-shadow-lg">
          🛡️ Compliance & Audit Logs
        </h1>
        <p className="text-gray-400 mt-2">Immutable security ledger. Monitor all system interactions.</p>
      </div>

      <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700 rounded-2xl shadow-xl overflow-hidden relative">
        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-gray-700 via-rose-500 to-gray-700"></div>
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-900/90 border-b border-gray-700 sticky top-0 z-10 shadow-md">
              <tr>
                <th className="p-4 font-semibold text-gray-300 w-24">ID</th>
                <th className="p-4 font-semibold text-gray-300">Timestamp</th>
                <th className="p-4 font-semibold text-gray-300">Actor (User)</th>
                <th className="p-4 font-semibold text-gray-300">Action / Event</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {logs.length === 0 ? (
                <tr><td colSpan="4" className="p-6 text-center text-gray-500">No audit records found.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-750/30 transition duration-150">
                    <td className="p-4 text-xs font-mono text-gray-500">#{log.id}</td>
                    <td className="p-4 text-sm text-gray-400">
                      {new Date(log.timestamp).toLocaleString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric', 
                        hour: '2-digit', minute:'2-digit', second:'2-digit'
                      })}
                    </td>
                    <td className="p-4 font-medium text-blue-300">{log.user}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full tracking-wider border ${
                        log.action.includes("login_failed") ? "bg-red-900/30 text-red-400 border-red-500/50" :
                        log.action.includes("login") ? "bg-emerald-900/30 text-emerald-400 border-emerald-500/50" :
                        log.action.includes("admin") ? "bg-yellow-900/30 text-yellow-400 border-yellow-500/50" :
                        log.action.includes("predict:attack") ? "bg-orange-900/30 text-orange-400 border-orange-500/50" :
                        "bg-gray-800 text-gray-300 border-gray-600"
                      }`}>
                        {log.action.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AuditLogs;
