import { useEffect, useState } from "react";
import { api } from "../config";

function Explorer() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs("");
  }, []);

  const fetchLogs = async (prediction = "") => {
    try {
      setLoading(true);
      const params = prediction ? { prediction } : {};
      const res = await api.get("/logs-filter", { params });
      setLogs(res.data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilter(value);
    fetchLogs(value);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">📂 Data Explorer</h2>

      {/* Filter */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <label className="block text-sm font-semibold mb-2">Filter by Prediction</label>
        <select
          value={filter}
          onChange={handleFilterChange}
          className="w-full md:w-48 border border-gray-300 p-2 rounded"
        >
          <option value="">All Logs</option>
          <option value="attack">Attacks Only</option>
          <option value="normal">Normal Traffic Only</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded">
          <p className="text-gray-600 text-sm">Total Logs</p>
          <p className="text-2xl font-bold text-blue-600">{logs.length}</p>
        </div>
        <div className="bg-red-100 p-4 rounded">
          <p className="text-gray-600 text-sm">Attacks</p>
          <p className="text-2xl font-bold text-red-600">
            {logs.filter((l) => l.prediction === "attack").length}
          </p>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <p className="text-gray-600 text-sm">Normal</p>
          <p className="text-2xl font-bold text-green-600">
            {logs.filter((l) => l.prediction === "normal").length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No logs found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Prediction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{log.id}</td>
                  <td className="px-6 py-3 text-sm">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        log.prediction === "attack"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {log.prediction}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Explorer;