import { useEffect, useState, useRef } from "react";

function Console() {
  const [logs, setLogs] = useState([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket("ws://localhost:8000/ws");

      ws.onopen = () => {
        console.log("WebSocket connected");
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "logs" && Array.isArray(data.data)) {
            setLogs((prevLogs) => [...data.data, ...prevLogs].slice(0, 100));
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnected(false);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setConnected(false);
        // Try to reconnect every 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Error connecting WebSocket:", error);
      setTimeout(connectWebSocket, 5000);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-6 flex flex-col h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">🔴 Real-Time Console</h2>
          <p className="text-gray-600 text-sm mt-1">Live intrusion detection events</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm font-semibold">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <button
            onClick={clearLogs}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Console Output */}
      <div className="flex-1 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-y-auto border border-gray-700 shadow-lg">
        {logs.length === 0 ? (
          <div className="text-gray-500">
            <p>Waiting for incoming detection events...</p>
            <p className="text-xs mt-4">
              {connected ? "✓ Connected to live stream" : "✗ Reconnecting..."}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <div
                key={`${log.id}-${log.timestamp}`}
                className={`${
                  log.prediction === "attack" ? "text-red-400" : "text-green-400"
                }`}
              >
                <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{" "}
                <span className="font-bold">ID#{log.id}</span> →{" "}
                <span className={log.prediction === "attack" ? "text-red-500 font-bold" : ""}>
                  {log.prediction.toUpperCase()}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="bg-blue-100 p-3 rounded">
          <p className="text-xs text-gray-600">Total</p>
          <p className="text-xl font-bold text-blue-600">{logs.length}</p>
        </div>
        <div className="bg-red-100 p-3 rounded">
          <p className="text-xs text-gray-600">Attacks</p>
          <p className="text-xl font-bold text-red-600">
            {logs.filter((l) => l.prediction === "attack").length}
          </p>
        </div>
        <div className="bg-green-100 p-3 rounded">
          <p className="text-xs text-gray-600">Normal</p>
          <p className="text-xl font-bold text-green-600">
            {logs.filter((l) => l.prediction === "normal").length}
          </p>
        </div>
        <div className={`${connected ? "bg-green-100" : "bg-yellow-100"} p-3 rounded`}>
          <p className="text-xs text-gray-600">Status</p>
          <p className={`text-xl font-bold ${connected ? "text-green-600" : "text-yellow-600"}`}>
            {connected ? "Live" : "Offline"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Console;