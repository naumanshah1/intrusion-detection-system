import { useEffect, useState } from "react";
import { api } from "../config";

function Alerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts');
      setAlerts(res.data);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🚨 Alerts</h2>

      <div className="space-y-4">
        {alerts.length === 0 ? (
          <p className="text-gray-500">No alerts yet</p>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-red-800">{alert.type}</h3>
                  <p className="text-red-600">Severity: {alert.severity}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Alerts;