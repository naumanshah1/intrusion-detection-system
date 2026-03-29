function Intelligence() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🌐 Traffic Intelligence</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600 mb-4">
          Advanced traffic pattern analysis and anomaly detection coming soon...
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Pattern Recognition</h3>
            <p className="text-gray-500">Identify common attack patterns</p>
          </div>

          <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Anomaly Detection</h3>
            <p className="text-gray-500">Detect unusual traffic behavior</p>
          </div>

          <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Geographic Analysis</h3>
            <p className="text-gray-500">Track attack sources by location</p>
          </div>

          <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Predictive Modeling</h3>
            <p className="text-gray-500">Forecast potential threats</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Intelligence;