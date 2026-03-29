import { useEffect, useState } from "react";
import { api } from "../config";

function Dashboard() {
  const [stats, setStats] = useState({});
  const [result, setResult] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/analytics');
      setStats(res.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const detect = async () => {
    try {
      const res = await api.post('/predict', {
        protocol_type: "tcp",
        service: "http",
        flag: "SF",
        src_bytes: 200,
        dst_bytes: 500,
      });

      setResult(res.data.prediction);
      fetchStats();
    } catch (error) {
      console.error("Error running detection:", error);
      setResult("Error occurred");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🏠 Dashboard</h1>

      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="bg-blue-100 p-4 rounded">Total: {stats.total || 0}</div>
        <div className="bg-red-100 p-4 rounded">Attacks: {stats.attacks || 0}</div>
        <div className="bg-green-100 p-4 rounded">Normal: {stats.normal || 0}</div>
      </div>

      <button
        onClick={detect}
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
      >
        🔍 Run Detection
      </button>

      <h2 className="mt-4 text-xl">
        Result: {result ? (
          result === "attack" ? "🚨 Attack Detected!" : "✅ Normal Traffic"
        ) : "⏳ No detection yet"}
      </h2>
    </div>
  );
}

export default Dashboard;