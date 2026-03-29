import { useEffect, useState } from "react";
import { api } from "../config";

function Analytics() {
  const [data, setData] = useState({});

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics');
      setData(res.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const attackPercentage = data.total > 0 ? ((data.attacks / data.total) * 100).toFixed(1) : 0;
  const normalPercentage = data.total > 0 ? ((data.normal / data.total) * 100).toFixed(1) : 0;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📊 Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Requests</h3>
          <p className="text-3xl font-bold text-blue-600">{data.total || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Attacks Detected</h3>
          <p className="text-3xl font-bold text-red-600">{data.attacks || 0}</p>
          <p className="text-sm text-gray-600">{attackPercentage}% of total</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Normal Traffic</h3>
          <p className="text-3xl font-bold text-green-600">{data.normal || 0}</p>
          <p className="text-sm text-gray-600">{normalPercentage}% of total</p>
        </div>
      </div>

      {/* Simple Chart Visualization */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Distribution</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Normal Traffic</span>
              <span>{normalPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full"
                style={{ width: `${normalPercentage}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Attacks</span>
              <span>{attackPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-red-500 h-4 rounded-full"
                style={{ width: `${attackPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;