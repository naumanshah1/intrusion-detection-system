function Sidebar({ user, onLogout, currentPage, setCurrentPage }) {
  const isAdmin = user?.role === "admin";
  const isActive = (page) => currentPage === page;

  return (
    <div className="w-64 h-screen bg-gray-900 text-white p-5 shadow-lg flex flex-col">
      <h1 className="text-2xl font-bold mb-8 text-blue-400">🚨 IDS SaaS</h1>
      <p className="text-xs text-gray-400 mb-4">Logged in as: {user?.username} ({user?.role})</p>

      <ul className="space-y-2 flex-1 text-sm">
        <li><button onClick={() => setCurrentPage("dashboard")} className={`w-full text-left px-2 py-2 rounded hover:text-blue-400 transition ${isActive("dashboard") ? "text-blue-400 bg-gray-800" : ""}`}>🏠 Dashboard</button></li>
        <li><button onClick={() => setCurrentPage("alerts")} className={`w-full text-left px-2 py-2 rounded hover:text-blue-400 transition ${isActive("alerts") ? "text-blue-400 bg-gray-800" : ""}`}>🚨 Alerts</button></li>
        <li><button onClick={() => setCurrentPage("investigation")} className={`w-full text-left px-2 py-2 rounded hover:text-blue-400 transition ${isActive("investigation") ? "text-blue-400 bg-gray-800" : ""}`}>🔍 Investigation</button></li>
        <li><button onClick={() => setCurrentPage("analytics")} className={`w-full text-left px-2 py-2 rounded hover:text-blue-400 transition ${isActive("analytics") ? "text-blue-400 bg-gray-800" : ""}`}>📊 Analytics</button></li>
        <li><button onClick={() => setCurrentPage("intelligence")} className={`w-full text-left px-2 py-2 rounded hover:text-blue-400 transition ${isActive("intelligence") ? "text-blue-400 bg-gray-800" : ""}`}>🌐 Intelligence</button></li>

        <li className="border-t border-gray-700 my-2 pt-2"><button onClick={() => setCurrentPage("rules")} className={`w-full text-left px-2 py-2 rounded hover:text-blue-400 transition ${isActive("rules") ? "text-blue-400 bg-gray-800" : ""}`}>⚙️ Rules</button></li>
        <li><button onClick={() => setCurrentPage("models")} className={`w-full text-left px-2 py-2 rounded hover:text-blue-400 transition ${isActive("models") ? "text-blue-400 bg-gray-800" : ""}`}>🤖 Models</button></li>
        <li><button onClick={() => setCurrentPage("explorer")} className={`w-full text-left px-2 py-2 rounded hover:text-blue-400 transition ${isActive("explorer") ? "text-blue-400 bg-gray-800" : ""}`}>📂 Explorer</button></li>
        <li><button onClick={() => setCurrentPage("console")} className={`w-full text-left px-2 py-2 rounded hover:text-blue-400 transition ${isActive("console") ? "text-blue-400 bg-gray-800" : ""}`}>🔴 Console</button></li>

        {isAdmin && (
          <>
            <li className="border-t border-gray-700 my-2 pt-2"><button onClick={() => setCurrentPage("config")} className={`w-full text-left px-2 py-2 rounded hover:text-blue-400 transition ${isActive("config") ? "text-blue-400 bg-gray-800" : ""}`}>⚙️ Config</button></li>
            <li><button onClick={() => setCurrentPage("reports")} className={`w-full text-left px-2 py-2 rounded hover:text-blue-400 transition ${isActive("reports") ? "text-blue-400 bg-gray-800" : ""}`}>📄 Reports</button></li>
            <li><button onClick={() => setCurrentPage("apihub")} className={`w-full text-left px-2 py-2 rounded hover:text-blue-400 transition ${isActive("apihub") ? "text-blue-400 bg-gray-800" : ""}`}>🔌 API Hub</button></li>
            <li><button onClick={() => setCurrentPage("audit")} className={`w-full text-left px-2 py-2 rounded hover:text-blue-400 transition ${isActive("audit") ? "text-blue-400 bg-gray-800" : ""}`}>🛡️ Audit Logs</button></li>
          </>
        )}
      </ul>

      <div className="pt-8 border-t border-gray-700">
        <button
          onClick={onLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded transition"
        >
          🚪 Logout
        </button>
        <p className="text-gray-500 text-sm mt-4">© 2026 IDS SaaS</p>
      </div>
    </div>
  );
}

export default Sidebar;
