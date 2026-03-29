import { useState, useEffect } from "react";
import { api } from "../config";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotes = async () => {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data);
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    fetchNotes();
    const interval = setInterval(fetchNotes, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => n.status === "unread").length;

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/read/${id}`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, status: "read" } : n));
    } catch (err) {
      console.error("Failed to mark as read");
    }
  };

  return (
    <div className="fixed top-6 right-6 z-50">
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-gray-800 p-3 rounded-full border border-gray-600 shadow-xl hover:bg-gray-700 transition transform hover:scale-105"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-gray-800/95 backdrop-blur-md border border-gray-600 shadow-2xl rounded-2xl overflow-hidden animate-fade-in text-white">
          <div className="p-4 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-200">System Alerts</h3>
            {unreadCount > 0 && <span className="text-xs bg-red-500 px-2 py-1 rounded text-white">{unreadCount} New</span>}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No recent notifications</div>
            ) : (
              <ul className="divide-y divide-gray-700">
                {notifications.map((note) => (
                  <li 
                    key={note.id} 
                    className={`p-4 transition ${note.status === 'unread' ? 'bg-red-900/20' : 'hover:bg-gray-700/50'}`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className={`text-sm ${note.status === 'unread' ? 'text-red-300 font-semibold' : 'text-gray-400'}`}>
                          {note.message}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {new Date(note.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      {note.status === "unread" && (
                        <button 
                          onClick={() => markAsRead(note.id)}
                          className="text-xs text-blue-400 hover:text-blue-300 font-bold"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;
