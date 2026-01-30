import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Book, Users, LogOut } from 'lucide-react';
import TextPressure from '../components/TextPressure';
import Lanyard from '../components/Lanyard';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activePopup, setActivePopup] = useState<null | 'favorites' | 'friends' | 'avatar'>(null);

  // State for the logged-in user
  const [user, setUser] = useState({
    username: 'Loading...',
    email: 'user@example.com',
    profileImage: 'https://picsum.photos/200/300' // Default fallback
  });

  // Temp avatar for preview before saving
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Simulation: Getting logged-in user data from localStorage or an API
  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser({
      username: loggedInUser.username || 'bookworm42', // Fallback to dummy if empty
      email: loggedInUser.email || 'bookworm@example.com',
      profileImage: loggedInUser.profileImage || loggedInUser.avatar || loggedInUser.profileImageUrl || 'https://picsum.photos/200/300'
    });
  }, []);

  // --- DUMMY DATA FOR POPUPS ---
  const dummyData = {
    favorites: [
      { id: 1, title: 'The Great Gatsby' },
      { id: 2, title: '1984 - George Orwell' },
      { id: 3, title: 'Harry Potter' },
      { id: 4, title: 'The Hobbit' },
      { id: 5, title: 'Pride and Prejudice' },
      { id: 6, title: 'The Alchemist' }
    ],
    friends: [
      'Alice Johnson', 'Sherlock Holmes', 'Gandalf Grey', 'Bob Builder',
      'Charlie Brown', 'John Watson', 'Hermione Granger'
    ]
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setTempAvatar(result); // Only update preview
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAvatar = () => {
    if (tempAvatar) {
      // Update local state
      setUser(prev => ({ ...prev, profileImage: tempAvatar }));

      // Update persistent storage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...storedUser, profileImage: tempAvatar }));

      // Close popup and clear temp
      setActivePopup(null);
      setTempAvatar(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    console.log("Logged out successfully");
    navigate('/login');
  };

  const closePopup = () => {
    setActivePopup(null);
    setTempAvatar(null); // Clear preview on close
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      backgroundColor: '#050505',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'sans-serif'
    }}>

      {/* 1. Global Style to Hide Scrollbar */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 2. BACKGROUND (Brighter PagePulse Pattern) */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-20%',
        width: '140%',
        height: '140%',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        opacity: 0.3, // Increased brightness
        transform: 'rotate(-15deg)',
        gap: '50px'
      }}>
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
              minFontSize={120}
              className="text-6xl font-bold bg-gradient-to-r from-[#bb750d] via-[#d45b0a] to-[#c8d50e] bg-clip-text text-transparent animate-gradient-x"
            />
          </div>
        ))}
      </div>

      {/* 3. HEADER (Back Button) */}
      <div style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 100 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: '48px', height: '48px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer', color: 'white'
          }}
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* 4. CENTER: 3D ID CARD */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
        <Lanyard
          position={[0, 0, 20]}
          gravity={[0, -40, 0]}
          profileImageUrl={user.profileImage}
        />
      </div>

      {/* 5. UI OVERLAY (The 4 Corner logic) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '5rem'
      }}>

        {/* TOP ROW */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* LOGGED IN USERNAME (Top Left) */}
          <div style={{ pointerEvents: 'auto' }}>
            <h1 style={{
              fontSize: '5rem',
              fontWeight: '900',
              color: 'white',
              margin: 0,
              textShadow: '0 10px 30px rgba(0,0,0,0.8)'
            }}>
              {user.username}
            </h1>
            <p style={{ color: '#d4af37', fontWeight: 'bold', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>Active User</p>

            {/* CHANGE AVATAR BUTTON */}
            <button
              onClick={() => setActivePopup('avatar')}
              style={{
                marginTop: '1.5rem',
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)',
                color: '#d4af37', padding: '0.6rem 1.2rem', borderRadius: '15px',
                cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
                transition: 'all 0.3s'
              }}
            >
              <Users size={16} /> {/* Reusing Users icon or could import Camera/Edit */}
              Change Avatar
            </button>
          </div>

          {/* FRIENDS BUTTON (Top Right) */}
          <button
            onClick={() => setActivePopup('friends')}
            style={cornerButtonStyle}
          >
            <Users size={20} />
            <span>Friends List</span>
          </button>
        </div>

        {/* BOTTOM ROW */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {/* FAVORITES BUTTON (Bottom Left) */}
          <button
            onClick={() => setActivePopup('favorites')}
            style={cornerButtonStyle}
          >
            <Book size={20} />
            <span>Favorites</span>
          </button>

          {/* EMAIL & LOGOUT (Bottom Right) */}
          <div style={{ textAlign: 'right', pointerEvents: 'auto' }}>
            <p style={{ color: '#71717a', fontSize: '0.8rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Linked Email</p>
            <p style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 1.5rem 0' }}>{user.email}</p>

            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444', padding: '0.8rem 1.5rem', borderRadius: '15px',
                cursor: 'pointer', fontWeight: 'bold', float: 'right', transition: '0.2s'
              }}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* 6. POPUP OVERLAY */}
      {activePopup && (
        <div style={overlayStyle} onClick={closePopup}>
          <div style={popupStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'white', margin: 0, textTransform: 'capitalize' }}>{activePopup}</h2>
              <button onClick={closePopup} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div className="no-scrollbar" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              maxHeight: '350px',
              overflowY: 'auto'
            }}>
              {activePopup === 'favorites' ? (
                dummyData.favorites.map(book => (
                  <button
                    key={book.id}
                    onClick={() => navigate(`/read/${book.id}`)}
                    style={itemButtonStyle}
                  >
                    {book.title}
                  </button>
                ))
              ) : activePopup === 'friends' ? (
                dummyData.friends.map((name, i) => (
                  <div key={i} style={itemStyle}>{name}</div>
                ))
              ) : (
                // AVATAR POPUP CONTENT
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                  <div style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '3px solid #d4af37',
                    boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
                    position: 'relative'
                  }}>
                    {isUploading && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                      }}>
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#d4af37]" />
                      </div>
                    )}
                    <img
                      src={tempAvatar || user.profileImage}
                      alt="Avatar Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isUploading ? 0.5 : 1 }}
                    />
                  </div>

                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label
                      htmlFor="avatar-upload"
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px dashed rgba(255,255,255,0.2)',
                        borderRadius: '1rem',
                        color: '#a1a1aa',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                    >
                      {tempAvatar ? 'Choose a different image' : 'Click to upload new image'}
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                    </label>

                    <button
                      onClick={handleSaveAvatar}
                      disabled={!tempAvatar}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: tempAvatar ? '#d4af37' : 'rgba(255,255,255,0.05)',
                        color: tempAvatar ? 'black' : 'rgba(255,255,255,0.2)',
                        border: 'none',
                        borderRadius: '1rem',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        cursor: tempAvatar ? 'pointer' : 'not-allowed',
                        transition: 'all 0.3s'
                      }}
                    >
                      Submit & Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- CSS STYLES ---

const cornerButtonStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  backgroundColor: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)',
  padding: '1.2rem 2.2rem',
  borderRadius: '100px',
  color: 'white',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: '0.3s'
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.85)',
  backdropFilter: 'blur(10px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 200
};

const popupStyle: React.CSSProperties = {
  backgroundColor: '#0a0a0a',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '2.5rem',
  width: '90%',
  maxWidth: '450px',
  padding: '2.5rem',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
};

const itemButtonStyle: React.CSSProperties = {
  backgroundColor: 'rgba(212, 175, 55, 0.1)',
  border: '1px solid rgba(212, 175, 55, 0.2)',
  color: '#d4af37',
  padding: '1.2rem',
  borderRadius: '1.2rem',
  textAlign: 'left',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '1rem'
};

const itemStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.05)',
  color: '#e4e4e7',
  padding: '1.2rem',
  borderRadius: '1.2rem',
  fontSize: '1rem'
};

export default ProfilePage;