import { useEffect, useState } from "react";
import { api } from "../config";

function Rules() {
  const [rules, setRules] = useState([]);
  const [field, setField] = useState("");
  const [operator, setOperator] = useState(">");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await api.get("/rules");
      setRules(res.data);
    } catch (error) {
      console.error("Error fetching rules:", error);
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!field || !value) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      await api.post("/add-rule", {}, {
        params: { field, operator, value }
      });
      setField("");
      setValue("");
      fetchRules();
    } catch (error) {
      console.error("Error adding rule:", error);
      alert("Failed to add rule");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm("Delete this rule?")) return;

    try {
      await api.delete(`/delete-rule/${ruleId}`);
      fetchRules();
    } catch (error) {
      console.error("Error deleting rule:", error);
      alert("Failed to delete rule");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">⚙️ Rules Engine</h2>

      {/* Add Rule Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Create Custom Rule</h3>
        <form onSubmit={handleAddRule} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Field (e.g. src_bytes)"
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="border border-gray-300 p-2 rounded"
            />
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="border border-gray-300 p-2 rounded"
            >
              <option value=">">&gt;</option>
              <option value="<">&lt;</option>
              <option value="==">=</option>
              <option value="!=">≠</option>
              <option value=">=">&gt;=</option>
              <option value="<=">&lt;=</option>
            </select>
            <input
              type="text"
              placeholder="Value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="border border-gray-300 p-2 rounded"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Rule"}
          </button>
        </form>
      </div>

      {/* Rules List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Active Rules ({rules.length})</h3>
        {rules.length === 0 ? (
          <p className="text-gray-500">No rules yet. Create one above.</p>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between bg-gray-50 p-4 rounded">
                <code className="text-sm">
                  IF <span className="font-semibold">{rule.field}</span> {rule.operator}{" "}
                  <span className="font-semibold">{rule.value}</span> → ATTACK
                </code>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Rules;