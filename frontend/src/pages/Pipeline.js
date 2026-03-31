import { useState, useEffect } from "react";
import { api } from "../config";

function Pipeline() {
  const [pipelineStatus, setPipelineStatus] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPipelineStatus();
    const interval = setInterval(fetchPipelineStatus, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPipelineStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get("/pipeline/status");
      setPipelineStatus(res.data);
    } catch (error) {
      console.error("Error fetching pipeline status:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-700 border-green-300";
      case "degraded":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "down":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">📡 Real-Time Data Pipeline</h2>

      <div className="grid grid-cols-1 gap-6">
        {/* Pipeline Overview */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Pipeline Flow</h3>
          <div className="flex justify-between items-center">
            <div className="text-center">
              <div className="text-3xl mb-2">📥</div>
              <p className="font-semibold">Ingestion</p>
              <p className="text-xs text-gray-600">Kafka Topics</p>
            </div>
            <div className="flex-1 border-t-2 border-blue-400 mx-4"></div>
            <div className="text-center">
              <div className="text-3xl mb-2">⚙️</div>
              <p className="font-semibold">Processing</p>
              <p className="text-xs text-gray-600">Feature Extraction</p>
            </div>
            <div className="flex-1 border-t-2 border-blue-400 mx-4"></div>
            <div className="text-center">
              <div className="text-3xl mb-2">🤖</div>
              <p className="font-semibold">Model</p>
              <p className="text-xs text-gray-600">ML Prediction</p>
            </div>
            <div className="flex-1 border-t-2 border-blue-400 mx-4"></div>
            <div className="text-center">
              <div className="text-3xl mb-2">💾</div>
              <p className="font-semibold">Storage</p>
              <p className="text-xs text-gray-600">SQLite DB</p>
            </div>
          </div>
        </div>

        {/* Component Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">🔧 Component Health</h3>
          <div className="space-y-4">
            {pipelineStatus.map((component) => (
              <div
                key={component.component}
                className={`p-4 rounded-lg border ${getStatusColor(component.status)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold capitalize">{component.component}</h4>
                    <p className="text-sm opacity-75">
                      {component.status === "healthy" ? "✅ Healthy" : component.status === "degraded" ? "⚠️ Degraded" : "❌ Down"}
                    </p>
                  </div>
                  <span className="text-2xl">
                    {component.component === "kafka" && "📨"}
                    {component.component === "processor" && "⚡"}
                    {component.component === "database" && "🗄️"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs opacity-75">Throughput</p>
                    <p className="text-lg font-bold">{component.packets_per_sec} pkt/sec</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-75">Latency</p>
                    <p className="text-lg font-bold">{component.latency_ms}ms</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 bg-black bg-opacity-20 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      component.status === "healthy"
                        ? "bg-green-500"
                        : component.status === "degraded"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      width: component.status === "healthy" ? "100%" : component.status === "degraded" ? "60%" : "20%"
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stream Metrics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">📊 Stream Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-gray-600 text-sm">Total Packets Processed</p>
              <p className="text-3xl font-bold text-blue-600">1.2M</p>
              <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-gray-600 text-sm">Avg Processing Time</p>
              <p className="text-3xl font-bold text-green-600">42ms</p>
              <p className="text-xs text-gray-500 mt-1">Per packet</p>
            </div>
            <div className="bg-orange-50 p-4 rounded">
              <p className="text-gray-600 text-sm">Current Backlog</p>
              <p className="text-3xl font-bold text-orange-600">125</p>
              <p className="text-xs text-gray-500 mt-1">Pending items</p>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <p className="text-gray-600 text-sm">System Uptime</p>
              <p className="text-3xl font-bold text-purple-600">99.9%</p>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </div>
          </div>
        </div>

        {/* Last Update */}
        <div className="text-center text-sm text-gray-500 mt-4">
          Auto-refreshing every 5 seconds
          <button
            onClick={fetchPipelineStatus}
            className="ml-4 text-blue-600 hover:text-blue-700 underline"
          >
            Refresh now
          </button>
        </div>
      </div>
    </div>
  );
}

export default Pipeline;
