import { useState } from "react";
import axios from "axios";
import API_URL from "../config";

function Login({ setToken, setUser }) {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!credentials.username || !credentials.password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const endpoint = isLogin ? "/login" : "/signup";
      const res = await axios.post(`${API_URL}${endpoint}`, credentials);

      if (res.data.access_token) {
        setToken(res.data.access_token);
        localStorage.setItem("token", res.data.access_token);
        const role = res.data.role || "user";
        const loggedUser = { username: credentials.username, role };
        setUser(loggedUser);
        localStorage.setItem("user", JSON.stringify(loggedUser));
      } else if (res.data.message) {
        // Signup successful, auto login
        const loginRes = await axios.post(`${API_URL}/login`, credentials);
        setToken(loginRes.data.access_token);
        localStorage.setItem("token", loginRes.data.access_token);
        const role = loginRes.data.role || "user";
        const loggedUser = { username: credentials.username, role };
        setUser(loggedUser);
        localStorage.setItem("user", JSON.stringify(loggedUser));
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">🚨 IDS SaaS</h1>
          <p className="text-gray-600">{isLogin ? "Welcome Back" : "Create Account"}</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              placeholder="Enter username"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              placeholder="Enter password"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 mt-6"
          >
            {loading ? "⏳ Processing..." : isLogin ? "Login" : "Sign Up"}
          </button>
        </div>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-blue-600 font-semibold hover:underline"
            >
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
