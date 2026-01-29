import { useState, type KeyboardEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  User, 
  UserPlus,
  X,
  Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InfiniteMenu from '../components/InfiniteMenu'; 
import TextPressure from '../components/TextPressure'; 

// --- MOCK DATA ---
const MOCK_CONVERSATIONS = [
  { id: '1', username: 'Alice', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', lastMessage: 'Wait, did he really just hide in the closet? 😂', unread: 2 },
  { id: '2', username: 'Bob', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', lastMessage: 'The fence scene is iconic!', unread: 0 },
  { id: '3', username: 'Charlie', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie', lastMessage: 'Are we meeting for the book club today?', unread: 5 },
  { id: '4', username: 'David', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', lastMessage: 'I found a PDF version if you need it.', unread: 0 },
  { id: '5', username: 'Sarah Connor', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', lastMessage: 'Terminator 2 is better than the book.', unread: 1 },
  { id: '6', username: 'Gandalf', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gandalf', lastMessage: 'A wizard is never late.', unread: 0 },
  { id: '7', username: 'Sherlock', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sherlock', lastMessage: 'Elementary, my dear Watson.', unread: 3 }
];

// --- HEADER COMPONENT ---
interface HeaderProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
}

const Header = ({ searchValue = '', onSearchChange, onSearchSubmit }: HeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // NEW: State for Add Friend Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  const handleAddFriend = () => {
    console.log("Friend request sent to:", friendUsername);
    // Add logic to send request here
    setFriendUsername('');
    setIsModalOpen(false);
  };

  return (
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
          {/* UPDATED: Add Friend Button now opens modal */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="group" 
            style={{ height: '50px', padding: '0 24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', borderRadius: '12px', backgroundColor: '#d4af37', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(212, 175, 55, 0.2)' }}
          >
            <UserPlus className="w-5 h-5 text-black" />
            <span className="text-black font-bold text-sm uppercase tracking-wide">Add Friend</span>
          </button>
          
          <button onClick={() => navigate('/profile')} style={{ width: '56px', height: '56px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', overflow: 'hidden' }}>
            {user?.avatar ? <img src={user.avatar} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User className="w-6 h-6 text-zinc-400" />}
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
            <p style={{ color: '#888', marginBottom: '24px' }}>Enter the username of the person you'd like to add.</p>

            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <input 
                type="text" 
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                placeholder="Enter username..."
                style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', padding: '16px', color: '#fff', fontSize: '16px', outline: 'none' }}
                autoFocus
              />
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
  );
};

// --- MAIN PAGE ---
const ChatsListPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const menuItems = MOCK_CONVERSATIONS.map(chat => ({
      image: chat.avatar,
      link: `/chats/${chat.username}`, 
      title: chat.username,
      description: chat.lastMessage,
      unread: chat.unread > 0, 
      id: chat.id,
      username: chat.username
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
            <InfiniteMenu 
                items={menuItems} 
                activeIndex={activeIndex} 
            />
        </div>
      </main>
    </div>
  );
};

export default ChatsListPage;