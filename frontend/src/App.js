import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Alerts from "./pages/Alerts";
import Investigation from "./pages/Investigation";
import Analytics from "./pages/Analytics";
import Intelligence from "./pages/Intelligence";
import Rules from "./pages/Rules";
import Models from "./pages/Models";
import Explorer from "./pages/Explorer";
import Console from "./pages/Console";
import Config from "./pages/Config";
import Reports from "./pages/Reports";
import APIHub from "./pages/APIHub";
import AuditLogs from "./pages/AuditLogs";
import Login from "./pages/Login";
import Notifications from "./components/Notifications";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  const [currentPage, setCurrentPage] = useState("dashboard");

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  if (!token) {
    return <Login setToken={setToken} setUser={setUser} />;
  }


  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "alerts":
        return <Alerts />;
      case "investigation":
        return <Investigation />;
      case "analytics":
        return <Analytics />;
      case "intelligence":
        return <Intelligence />;
      case "rules":
        return <Rules />;
      case "models":
        return <Models />;
      case "explorer":
        return <Explorer />;
      case "console":
        return <Console />;
      case "config":
        return <Config />;
      case "reports":
        return <Reports />;
      case "apihub":
        return <APIHub />;
      case "audit":
        return <AuditLogs />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex">
      <Sidebar user={user} onLogout={handleLogout} currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 relative">
        <Notifications />
        {renderPage()}
      </div>
    </div>
  );
}

export default App;