function KPI({ title, value, icon }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition w-64">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-2">{title}</p>
          <h2 className="text-3xl font-bold text-gray-900">{value}</h2>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

export default KPI;
