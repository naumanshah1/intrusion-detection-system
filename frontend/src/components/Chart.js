function Chart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Detection Statistics</h3>
        <p className="text-gray-500">No data yet</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value || 0), 1);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-lg font-semibold mb-6 text-gray-900">Detection Statistics</h3>
      
      <div className="space-y-4">
        {data.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between mb-2">
              <span className="font-medium text-gray-700">{item.name}</span>
              <span className="font-bold text-blue-600">{item.value}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Chart;
