import { useState, useEffect } from "react";
import { api } from "../config";

function APIHub() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState(null);

  const fetchKeys = async () => {
    try {
      const response = await api.get("/api-keys");
      setKeys(response.data);
    } catch (err) {
      console.error("Failed to fetch API keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const generateKey = async () => {
    try {
      const response = await api.post("/api-keys");
      setNewKey(response.data.api_key);
      fetchKeys();
    } catch (err) {
      console.error("Failed to generate key");
    }
  };

  const revokeKey = async (id) => {
    if (!window.confirm("Are you sure you want to revoke this key? Any systems using it will immediately be blocked.")) return;
    try {
      await api.delete(`/api-keys/${id}`);
      fetchKeys();
    } catch (err) {
      console.error("Failed to revoke key");
    }
  };

  if (loading) return <div className="p-6 text-white text-center">Loading Hub...</div>;

  return (
    <div className="p-8 min-h-screen bg-gray-900 text-white">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400 drop-shadow-lg">
            🔌 API Hub
          </h1>
          <p className="text-gray-400 mt-2">Manage programmatic access. Keep your keys secret.</p>
        </div>
        <button
          onClick={generateKey}
          className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-gray-900 font-extrabold px-6 py-3 rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all"
        >
          + Generate New API Key
        </button>
      </div>

      {newKey && (
        <div className="bg-emerald-900/30 border border-emerald-500 p-6 rounded-2xl shadow-xl mb-8 flex flex-col gap-3">
          <h3 className="text-emerald-400 font-bold text-lg">🎉 Your New API Key is Ready</h3>
          <p className="text-sm text-gray-300">Copy this key now. For your security, <strong className="text-white">it will never be shown again</strong>.</p>
          <div className="flex items-center gap-4 mt-2">
            <code className="bg-gray-950 border border-gray-700 px-4 py-3 rounded-lg text-emerald-300 font-mono text-lg flex-1">
              {newKey}
            </code>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(newKey);
                alert("Copied to clipboard!");
              }}
              className="bg-gray-800 hover:bg-gray-700 px-4 py-3 border border-gray-600 rounded-lg text-sm font-bold transition"
            >
              📋 Copy
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
        <table className="w-full text-left mx-auto">
          <thead className="bg-gray-900/80 border-b border-gray-700">
            <tr>
               <th className="p-5 font-semibold text-gray-300">Key Identifier</th>
               <th className="p-5 font-semibold text-gray-300">Created At</th>
               <th className="p-5 font-semibold text-gray-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 ? (
              <tr><td colSpan="3" className="p-8 text-center text-gray-500 italic">No API keys found. Generate one to get started.</td></tr>
            ) : (
              keys.map((keyObj) => (
                <tr key={keyObj.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition group">
                  <td className="p-5 font-mono">
                    <span className="bg-gray-900 px-3 py-1 rounded text-gray-400 border border-gray-700">
                      ••••••••••••••••••••••••••••••
                    </span>
                  </td>
                  <td className="p-5 text-gray-400 text-sm">{new Date(keyObj.created_at).toLocaleString()}</td>
                  <td className="p-5 text-right">
                    <button 
                      onClick={() => revokeKey(keyObj.id)}
                      className="text-red-400 hover:text-white bg-red-900/20 hover:bg-red-600 px-4 py-2 border border-red-500/30 rounded font-semibold text-sm transition-all"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default APIHub;
