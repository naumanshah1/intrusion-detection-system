import { useEffect, useState } from "react";
import { api } from "../config";

function Models() {
  const [models, setModels] = useState([]);
  const [currentModel, setCurrentModel] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const res = await api.get("/models");
      setModels(res.data.available || []);
      setCurrentModel(res.data.current);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  const handleSwitchModel = async (modelName) => {
    if (modelName === currentModel) return;

    try {
      setLoading(true);
      await api.post("/set-model", {}, {
        params: { model_name: modelName }
      });
      setCurrentModel(modelName);
    } catch (error) {
      console.error("Error switching model:", error);
      alert("Failed to switch model");
    } finally {
      setLoading(false);
    }
  };

  const modelDescriptions = {
    hybrid: "Hybrid model combining multiple ML algorithms",
    rf: "Random Forest - Fast and robust ensemble method",
    lr: "Logistic Regression - Lightweight linear model"
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">🤖 Model Management</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {models.map((model) => (
          <div
            key={model}
            className={`border-2 p-6 rounded-lg cursor-pointer transition ${
              currentModel === model
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-400"
            }`}
            onClick={() => handleSwitchModel(model)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold capitalize">{model}</h3>
              {currentModel === model && (
                <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold">
                  Active
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-4">
              {modelDescriptions[model] || "ML Model"}
            </p>
            <button
              onClick={() => handleSwitchModel(model)}
              disabled={loading || currentModel === model}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Switching..." : currentModel === model ? "Current" : "Switch"}
            </button>
          </div>
        ))}
      </div>

      {/* Model Info */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">📊 Current Model: {currentModel.toUpperCase()}</h3>
        <p className="text-gray-600 mb-4">
          {modelDescriptions[currentModel] || "Model description"}
        </p>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> Model changes apply to all future predictions. Existing logs remain unchanged.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Models;