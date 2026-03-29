import { useState } from "react";
import axios from "axios";
import API_URL from "../config";

function PredictionForm({ setResult }) {
  const [form, setForm] = useState({
    protocol_type: "tcp",
    service: "http",
    flag: "SF",
    src_bytes: 200,
    dst_bytes: 500,
    count: 10,
    srv_count: 10,
    logged_in: 1,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const res = await axios.post(`${API_URL}/predict`, form, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setResult(res.data.prediction);
    } catch (err) {
      console.error("Prediction error:", err);
      setResult("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Protocol</label>
          <select
            name="protocol_type"
            value={form.protocol_type}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>tcp</option>
            <option>udp</option>
            <option>icmp</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
          <input
            name="service"
            value={form.service}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="http"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Src Bytes</label>
          <input
            type="number"
            name="src_bytes"
            value={form.src_bytes}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dst Bytes</label>
          <input
            type="number"
            name="dst_bytes"
            value={form.dst_bytes}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-blue-600 text-white px-4 py-3 rounded font-semibold hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? "⏳ Analyzing..." : "🚀 Run Detection"}
      </button>
    </div>
  );
}

export default PredictionForm;