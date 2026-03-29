import { useState, useEffect } from "react";
import { api } from "../config";

function Config() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const fetchConfigs = async () => {
    try {
      const response = await api.get("/config");
      setConfigs(response.data);
    } catch (err) {
      setError("Failed to fetch configurations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    try {
      await api.post("/config", { key: newKey, value: newValue });
      setNewKey("");
      setNewValue("");
      fetchConfigs();
    } catch (err) {
      setError("Failed to update configuration.");
    }
  };

  if (loading) return <div className="p-6 text-white text-center">Loading Configurations...</div>;

  return (
    <div className="p-8 min-h-screen bg-gray-900 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 drop-shadow-lg">
          ⚙️ System Configurations
        </h1>
        <p className="text-gray-400 mt-2">Manage thresholds, toggles, and engine parameters</p>
      </div>

      {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg mb-6">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Update Form */}
        <div className="md:col-span-1 bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-2xl shadow-xl h-fit">
          <h2 className="text-xl font-bold mb-4">Set Variable</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Key</label>
              <input
                type="text"
                placeholder="e.g. threshold_model"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Value</label>
              <input
                type="text"
                placeholder="e.g. 0.85"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              Save Configuration
            </button>
          </form>
        </div>

        {/* Existing Configs */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold mb-2">Active Configuration State</h2>
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-900/80 border-b border-gray-700">
                <tr>
                  <th className="p-4 font-semibold text-gray-300">Key</th>
                  <th className="p-4 font-semibold text-gray-300">Value</th>
                  <th className="p-4 font-semibold text-gray-300">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {configs.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-6 text-center text-gray-500">No active configurations found.</td>
                  </tr>
                ) : (
                  configs.map((cfg) => (
                    <tr key={cfg.key} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition">
                      <td className="p-4 font-mono text-emerald-400">{cfg.key}</td>
                      <td className="p-4 font-mono text-gray-300">{cfg.value}</td>
                      <td className="p-4 text-xs text-gray-500">{new Date(cfg.updated_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Config;
