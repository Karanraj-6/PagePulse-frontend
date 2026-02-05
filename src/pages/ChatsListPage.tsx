import { useState, type KeyboardEvent, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  User as UserIcon,
  UserPlus,
  X,
  Send,
  Bell,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InfiniteMenu from '../components/InfiniteMenu';
import TextPressure from '../components/TextPressure';
import { chatApi, authApi, notificationApi, type Conversation, type Notification } from '../services/api';

// --- HEADER COMPONENT (Same as before) ---
interface HeaderProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
}

const Header = ({ searchValue = '', onSearchChange, onSearchSubmit }: HeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Add Friend State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; username: string; avatar?: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; username: string; avatar?: string } | null>(null);

  // --- NOTIFICATION LOGIC ---
  const getNotificationTitle = (type: Notification['type']) => {
    switch (type) {
      case 'friend_requested': return 'Friend Request';
      case 'friend_accepted': return 'Friend Accepted';
      case 'welcome': return 'Welcome';
      default: return 'Notification';
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await notificationApi.getNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    if (showNotifications || user) {
      fetchNotifications();
    }
  }, [showNotifications, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationApi.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  const handleAction = async (id: string, action: 'accept' | 'reject', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      let response;
      if (action === 'accept') {
        response = await notificationApi.acceptRequestFromNotification(id);
        if (!response.success) {
          alert(`Failed to accept: ${response.message || 'Unknown error'}`);
          return;
        }
        alert(response.message || "Friend request accepted!");
      } else {
        response = await notificationApi.rejectRequestFromNotification(id);
        if (!response.success) {
          alert(`Failed to reject: ${response.message || 'Unknown error'}`);
          return;
        }
      }

      if (response.deleted) {
        setNotifications(prev => prev.filter(n => n._id !== id));
      } else {
        alert("Action succeeded but failed to clear notification. Refreshing...");
        fetchNotifications();
      }

    } catch (error: any) {
      console.error(`Failed to ${action} request:`, error);
      alert(`Failed to ${action} request: ${error.message || error.toString()}`);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  // --- ADD FRIEND LOGIC ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (friendUsername.length >= 2) {
        try {
          const users = await authApi.searchUsers(friendUsername);
          setSearchResults(users.filter(u => u.username !== user?.username));
        } catch (e) { console.error("Search failed", e); }
      } else { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [friendUsername, user]);

  const handleSelectUser = (u: { id: string; username: string; avatar?: string }) => {
    setSelectedUser(u);
    setFriendUsername(u.username);
    setSearchResults([]);
  };

  const handleAddFriend = async () => {
    let targetId = selectedUser?.id;
    let targetName = selectedUser?.username;

    if (!targetId && friendUsername) {
      try {
        const users = await authApi.searchUsers(friendUsername);
        const exactMatch = users.find(u => u.username.toLowerCase() === friendUsername.toLowerCase());
        if (exactMatch) {
          targetId = exactMatch.id;
        }
      } catch (e) { }
    }

    if (!targetId || !user) {
      alert("Please select a valid user from the suggestions.");
      return;
    }

    try {
      await authApi.sendFriendRequest(user.id, targetId);
      alert(`Friend request sent to ${targetName}`);
      setFriendUsername('');
      setSelectedUser(null);
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Failed to add friend:", error);
      alert(`Failed to send request: ${error.message}`);
    }
  };

  return (
    <>
      <style>{`
        .notification-bell-btn {
          width: 3.5rem; height: 3.5rem; display: flex; justify-content: center; align-items: center;
          border-radius: 50%; background-color: #111; border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer; transition: all 0.3s ease;
        }
        .notification-bell-icon { width: 1.5rem; height: 1.5rem; color: white; transition: color 0.15s ease; }
        .notification-bell-btn:hover .notification-bell-icon { color: #d4af37; }
        .notification-dropdown {
          position: absolute; right: 0; margin-top: 1rem; width: 22rem; background-color: #111;
          border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden; z-index: 50; backdrop-filter: blur(24px);
          animation: fadeIn 0.2s ease-out; transform-origin: top right;
        }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .notification-item { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; }
        .notification-item:hover { background-color: rgba(255,255,255,0.05); cursor: default; }
        .notification-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
        .notification-action-btn { font-size: 0.75rem; padding: 0.35rem 0.75rem; border-radius: 0.25rem; border: none; cursor: pointer; }
        .btn-accept { background: rgba(212, 175, 55, 0.15); color: #d4af37; border: 1px solid rgba(212,175,55,0.3); }
        .btn-reject { background: rgba(113, 113, 122, 0.15); color: #a1a1aa; border: 1px solid rgba(113,113,122,0.3); }
      `}</style>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, backgroundColor: 'rgba(5, 5, 5, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ width: '100%', maxWidth: '1800px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', gap: '40px' }}>

          <Link to="/home" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div className="flex justify-center items-center">
              <TextPressure text="PagePulse" flex={true} alpha={false} stroke={false} width={true} weight={true} italic={true} textColor="transparent" strokeColor="#000000" minFontSize={80} className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#bb750d] via-[#d45b0a] to-[#c8d50e] bg-clip-text text-transparent animate-gradient-x" />
            </div>
          </Link>

          {/* SEARCH BAR */}
          <div style={{ flex: 1, maxWidth: '800px', position: 'relative' }}>
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" style={{ pointerEvents: 'none' }} />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search friends (Enter to open chat)..."
              className="w-full bg-[#111] border border-zinc-800 text-white text-lg placeholder-zinc-600 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all shadow-inner"
              style={{ height: '56px', borderRadius: '9999px', paddingLeft: '50px', paddingRight: '24px' }}
              autoFocus
            />
          </div>

          {/* ACTIONS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button onClick={() => setShowNotifications(!showNotifications)} className="notification-bell-btn">
                <div style={{ position: 'relative' }}>
                  <Bell className="notification-bell-icon" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>
                  )}
                </div>
              </button>
              {showNotifications && (
                <div className="notification-dropdown">
                  <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ color: 'white', fontWeight: 600, margin: 0 }}>Notifications</h3>
                    <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}><X size={16} /></button>
                  </div>
                  <div style={{ maxHeight: '24rem', overflowY: 'auto' }}>
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div key={notif._id} className="notification-item">
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 500, color: '#d4af37', margin: 0 }}>{getNotificationTitle(notif.type)}</h4>
                            <span style={{ fontSize: '0.75rem', color: '#71717a' }}>{new Date(notif.created_at).toLocaleDateString()}</span>
                          </div>
                          <p style={{ fontSize: '0.875rem', color: '#d4d4d8', margin: 0 }}>
                            {notif.type === 'friend_requested' && notif.sender_username
                              ? `${notif.sender_username} wants to add you as a friend`
                              : notif.message}
                          </p>
                          {notif.type === 'friend_requested' && !notif.message.toLowerCase().includes('you accepted') && !notif.message.toLowerCase().includes('you rejected') && !notif.message.toLowerCase().includes('accepted your') ? (
                            <div className="notification-actions">
                              <button className="notification-action-btn btn-accept" onClick={(e) => handleAction(notif._id, 'accept', e)}>Accept</button>
                              <button className="notification-action-btn btn-reject" onClick={(e) => handleAction(notif._id, 'reject', e)}>Reject</button>
                            </div>
                          ) : (
                            <div className="notification-actions">
                              <button className="notification-action-btn btn-reject" onClick={(e) => handleDeleteNotification(notif._id, e)}>Clear</button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (<div style={{ padding: '2rem', textAlign: 'center', color: '#71717a', fontSize: '0.875rem' }}>No new notifications</div>)}
                  </div>
                </div>
              )}
            </div>

            {/* Add Friend Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="group"
              style={{ height: '50px', padding: '0 24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', borderRadius: '12px', backgroundColor: '#d4af37', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(212, 175, 55, 0.2)' }}
            >
              <UserPlus className="w-5 h-5 text-black" />
              <span className="text-black font-bold text-sm uppercase tracking-wide">Add Friend</span>
            </button>

            <button onClick={() => navigate('/profile')} style={{ width: '56px', height: '56px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', overflow: 'hidden' }}>
              {user?.avatar ? <img src={user.avatar} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserIcon className="w-6 h-6 text-zinc-400" />}
            </button>
          </div>
        </div>

        {/* NEW: ADD FRIEND MODAL OVERLAY */}
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, marginTop: '25rem' }}>
            <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '450px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>

              <button
                onClick={() => setIsModalOpen(false)}
                style={{ position: 'absolute', right: '20px', top: '20px', background: 'transparent', border: 'none', color: '#555', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>

              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}>Add a Friend</h2>
              <p style={{ color: '#888', marginBottom: '24px' }}>Search for user to add.</p>

              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <input
                  type="text"
                  value={friendUsername}
                  onChange={(e) => { setFriendUsername(e.target.value); setSelectedUser(null); }}
                  placeholder="Type username..."
                  style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', padding: '16px', color: '#fff', fontSize: '16px', outline: 'none' }}
                  autoFocus
                />
                {searchResults.length > 0 && !selectedUser && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#18181b', border: '1px solid #333', borderRadius: '0 0 12px 12px', zIndex: 50, boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
                    {searchResults.map(u => (
                      <div
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        style={{ padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#222'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#333', overflow: 'hidden' }}>
                          {u.avatar ? <img src={u.avatar} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserIcon size={16} className="text-zinc-500 m-auto mt-1.5" />}
                        </div>
                        <span style={{ color: '#fff', fontWeight: '500' }}>{u.username}</span>
                        <div style={{ marginLeft: 'auto', fontSize: '10px', color: '#666', border: '1px solid #333', padding: '2px 6px', borderRadius: '4px' }}>SELECT</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid #333', color: '#fff', borderRadius: '12px', height: '50px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFriend}
                  style={{ flex: 1, backgroundColor: '#d4af37', border: 'none', color: '#000', borderRadius: '12px', height: '50px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Send size={18} />
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// --- MAIN PAGE ---
const ChatsListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  // Use a merged type that can represent a Friend OR a Conversation
  interface ChatItem {
    id: string; // User ID is better for reliable identification
    username: string;
    avatar?: string;
    lastMessage: string;
    unread: boolean;
  }

  const [items, setItems] = useState<ChatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback for anonymous user
  const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        // 1. Fetch Friends (Source of Truth for "People")
        const friends = await authApi.getFriends(user.id);

        // 2. Fetch Active Conversations (To get last messages)
        const chatResponse = await chatApi.getConversations(user.id);
        const conversations = chatResponse.conversations || [];

        // 3. Merge Data
        // Map friends to UI items, filling in message data if a conversation exists
        const mergedItems = friends.map(friend => {
          // Find if there is an existing conversation with this friend
          const conversation = conversations.find(c =>
            c.other_participants && c.other_participants.includes(friend.id)
          );

          return {
            id: friend.id,
            username: friend.username,
            avatar: friend.avatar || DEFAULT_AVATAR,
            lastMessage: conversation?.last_message?.content || 'Start a conversation',
            unread: false // Logic for unread counts can be added later
          };
        });

        setItems(mergedItems);

      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Convert to props for InfiniteMenu
  const menuItems = items.map(item => ({
    image: item.avatar || DEFAULT_AVATAR,
    link: `/chats/${item.username}`,  // Navigation by username as requested
    title: item.username,
    description: item.lastMessage,
    username: item.username,
    id: item.id
  }));

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim() === '') return;
    const index = menuItems.findIndex(item =>
      item.title.toLowerCase().includes(value.toLowerCase())
    );
    if (index !== -1) {
      setActiveIndex(index);
    }
  };

  const handleEnterKey = () => {
    const targetItem = menuItems[activeIndex];
    if (targetItem) {
      navigate(targetItem.link);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] font-sans text-white">

      <Header
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleEnterKey}
      />

      <main style={{ paddingTop: '100px', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4af37]" />
            </div>
          ) : (
            <InfiniteMenu
              items={menuItems.length > 0 ? menuItems : []}
              activeIndex={activeIndex}
              scale={1.2}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default ChatsListPage;