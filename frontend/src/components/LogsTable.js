import { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "../config";

function LogsTable({ logs = [] }) {
  const [logsData, setLogsData] = useState(logs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/logs`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setLogsData(res.data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 text-gray-900">Recent Logs</h3>

      {loading ? (
        <p className="text-gray-500">Loading logs...</p>
      ) : logsData.length === 0 ? (
        <p className="text-gray-500">No logs yet</p>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Prediction</th>
            </tr>
          </thead>

          <tbody>
            {logsData.map((log) => (
              <tr key={log.id} className="text-center border-t">
                <td className="p-2">{log.id}</td>
                <td className="p-2">
                  <span className={log.prediction === "attack" ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                    {log.prediction}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default LogsTable;