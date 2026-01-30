import { type KeyboardEvent, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MessageCircle, User, Bell, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TextPressure from '../components/TextPressure';
import api, { type Notification } from '../services/api';

interface HeaderProps {
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  title?: string;
}

const Header = ({
  showSearch = true,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  title,
}: HeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await api.notifications.getUpdates();
        setNotifications(data);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  return (
    <>
      <style>{`
        .notification-bell-btn {
          width: 3.5rem;
          height: 3.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 50%;
          background-color: #111;
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .notification-bell-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: white;
          transition: color 0.15s ease;
        }
        .notification-bell-btn:hover .notification-bell-icon {
          color: #d4af37;
        }
        .notification-dropdown {
          position: absolute;
          right: 0;
          margin-top: 1rem;
          width: 20rem;
          background-color: #111;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          z-index: 50;
          backdrop-filter: blur(24px);
          animation: fadeIn 0.2s ease-out;
          transform-origin: top right;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .notification-header {
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .notification-title {
          color: white;
          font-weight: 600;
          margin: 0;
        }
        .notification-close-btn {
          color: #a1a1aa;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
        }
        .notification-close-btn:hover {
          color: white;
        }
        .notification-list {
          max-height: 24rem;
          overflow-y: auto;
        }
        .notification-item {
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .notification-item:hover {
          background-color: rgba(255, 255, 255, 0.05);
          cursor: default;
        }
        .notification-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.25rem;
        }
        .notification-item-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: #d4af37;
          margin: 0;
        }
        .notification-item-time {
          font-size: 0.75rem;
          color: #71717a;
        }
        .notification-item-message {
          font-size: 0.875rem;
          color: #d4d4d8;
          margin: 0;
        }
        .notification-content-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .notification-text-content {
          flex: 1;
          margin-right: 0.75rem;
        }
        .notification-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex-shrink: 0;
        }
        .notification-action-btn {
          font-size: 0.75rem;
          padding: 0.35rem 0.75rem;
          border-radius: 0.25rem;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .notification-btn-delete {
          background-color: rgba(220, 38, 38, 0.15);
          color: #ef4444;
          border: 1px solid rgba(220, 38, 38, 0.3);
        }
        .notification-btn-delete:hover {
          background-color: rgba(220, 38, 38, 0.25);
          border-color: rgba(220, 38, 38, 0.5);
        }
        .notification-empty {
          padding: 2rem;
          text-align: center;
          color: #71717a;
          font-size: 0.875rem;
        }
      `}</style>

      {/* ================= HEADER WRAPPER ================= */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 50,
          backgroundColor: 'transparent',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {/* ================= GRADIENT BACKGROUND ================= */}
        {/* <div
        className="
          absolute inset-0
          bg-gradient-to-r
          from-[#a89308]
          via-[#99066a]
          to-[#d95b0d]
          opacity-20
          blur-sm
          animate-gradient-x
        "
      /> */}

        {/* ================= CONTENT ================= */}
        <div
          className="relative z-10"
          style={{
            width: '100%',
            maxWidth: '1800px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 30px',
            gap: '40px',
          }}
        >
          {/* ================= LOGO ================= */}
          <Link to="/home" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div className="flex justify-center items-center">
              <TextPressure
                text="PagePulse"
                flex={true}
                alpha={false}
                stroke={false}
                width={true}
                weight={true}
                italic={true}
                textColor="transparent"
                strokeColor="#000000"
                minFontSize={80}
                className="
                text-4xl lg:text-5xl font-bold
                bg-gradient-to-r
                from-[#bb750d]
                via-[#d45b0a]
                to-[#c8d50e]
                bg-clip-text
                text-transparent
                animate-gradient-x
              "
              />
            </div>
          </Link>

          {/* ================= SEARCH ================= */}
          {showSearch ? (
            <div style={{ flex: 1, maxWidth: '800px', position: 'relative' }}>
              <Search
                className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-400"
                style={{ pointerEvents: 'none' }}
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search for a book..."
                className="
                w-full bg-[#111]
                border border-white/10
                text-white text-lg
                placeholder-zinc-500
                focus:outline-none
                focus:border-[#d4af37]
                focus:ring-1
                focus:ring-[#d4af37]
                transition-all
                shadow-inner
              "
                style={{
                  height: '56px',
                  borderRadius: '9999px',
                  paddingLeft: '60px',
                  paddingRight: '24px',
                }}
              />
            </div>
          ) : title ? (
            <h1 className="flex-1 text-3xl font-bold text-white truncate">
              {title}
            </h1>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          {/* ================= ACTIONS ================= */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              flexShrink: 0,
            }}
          >
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="notification-bell-btn"
              >
                <Bell className="notification-bell-icon" />
              </button>

              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h3 className="notification-title">Notifications</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="notification-close-btn"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="notification-list">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="notification-item"
                        >
                          <div className="notification-content-wrapper">
                            <div className="notification-text-content">
                              <div className="notification-item-header">
                                <h4 className="notification-item-title">{notif.title}</h4>
                                <span className="notification-item-time">{notif.time}</span>
                              </div>
                              <p className="notification-item-message">{notif.message}</p>
                            </div>
                            <div className="notification-actions">
                              <button
                                className="notification-action-btn notification-btn-delete"
                                onClick={(e) => handleDeleteNotification(notif.id, e)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="notification-empty">
                        No new notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/chats')}
              className="group"
              style={{
                width: '7rem',
                height: '3.5rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '25%',
                backgroundColor: '#111',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            > Chats
              <MessageCircle className="w-7 h-7 text-white group-hover:text-[#d4af37] transition-colors " style={{ marginLeft: '0.5rem' }} />
            </button>

            <button
              onClick={() => navigate('/profile')}
              style={{
                width: '56px',
                height: '56px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '50%',
                backgroundColor: '#111',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
              }}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <User className="w-7 h-7 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
