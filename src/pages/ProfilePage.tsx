import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Book, Users, LogOut, Upload } from 'lucide-react';
// @ts-ignore
import TextPressure from '../components/TextPressure';
// @ts-ignore
import Lanyard from '../components/Lanyard';
import { useAuth } from '../context/AuthContext';
import { authApi, userApi } from '../services/api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth();

  // Local state for fetched data
  const [activePopup, setActivePopup] = useState<null | 'favorites' | 'friends' | 'avatar'>(null);
  const [friends, setFriends] = useState<string[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Profile computed simulation (since User object might be minimal)
  const displayUser = {
    username: user?.username || 'Loading...',
    email: user?.email || 'No Email',
    profileImage: user?.avatar || 'https://ui-avatars.com/api/?name=' + (user?.username || 'User')
  };

  // Avatar upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch extra data on mount
  useEffect(() => {
    if (user?.id) {
      fetchFriends();
    }
  }, [user?.id]);

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const friendList = await authApi.getFriends(user!.id);
      setFriends(friendList.map(f => f.username));
    } catch (error) {
      console.error("Failed to fetch friends", error);
    } finally {
      setLoadingFriends(false);
    }
  };

  // --- DUMMY DATA FOR FAVORITES (Not yet in API) ---
  const favorites = [
    { id: 1, title: 'The Great Gatsby' },
    { id: 2, title: '1984 - George Orwell' },
    { id: 3, title: 'Harry Potter' },
    { id: 4, title: 'The Hobbit' },
    { id: 5, title: 'Pride and Prejudice' },
    { id: 6, title: 'The Alchemist' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setUploadError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      console.log('📤 Uploading avatar...');
      
      // Upload to S3 via backend
      const response = await userApi.uploadAvatar(selectedFile);
      
      console.log('✅ Avatar uploaded successfully:', response.avatarUrl);

      // Refresh the page to get updated user data
      window.location.reload();
    } catch (error: any) {
      console.error('❌ Avatar upload failed:', error);
      setUploadError(error.message || 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closePopup = () => {
    setActivePopup(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
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
        opacity: 0.3,
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
          profileImageUrl={displayUser.profileImage}
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
              {displayUser.username}
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
              <Upload size={16} />
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
            <p style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 1.5rem 0' }}>{displayUser.email}</p>

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
                favorites.map(book => (
                  <button
                    key={book.id}
                    onClick={() => navigate(`/read/${book.id}`)}
                    style={itemButtonStyle}
                  >
                    {book.title}
                  </button>
                ))
              ) : activePopup === 'friends' ? (
                friends.map((name, i) => (
                  <div key={i} style={itemStyle}>{name}</div>
                ))
              ) : (
                // AVATAR POPUP CONTENT
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                  {/* Preview Image */}
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
                      src={previewUrl || displayUser.profileImage}
                      alt="Avatar Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isUploading ? 0.5 : 1 }}
                    />
                  </div>

                  {/* Error Message */}
                  {uploadError && (
                    <div style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '0.5rem',
                      color: '#ef4444',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>
                      {uploadError}
                    </div>
                  )}

                  {/* Upload Controls */}
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
                      <Upload size={20} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                      {selectedFile ? selectedFile.name : 'Click to upload new image'}
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        disabled={isUploading}
                      />
                    </label>

                    <button
                      onClick={handleSaveAvatar}
                      disabled={!selectedFile || isUploading}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: selectedFile && !isUploading ? '#d4af37' : 'rgba(255,255,255,0.05)',
                        color: selectedFile && !isUploading ? 'black' : 'rgba(255,255,255,0.2)',
                        border: 'none',
                        borderRadius: '1rem',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        cursor: selectedFile && !isUploading ? 'pointer' : 'not-allowed',
                        transition: 'all 0.3s'
                      }}
                    >
                      {isUploading ? 'Uploading...' : 'Upload to Cloud'}
                    </button>

                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: '#71717a', 
                      textAlign: 'center', 
                      margin: 0 
                    }}>
                      Max file size: 5MB • Formats: JPG, PNG, GIF, WebP
                    </p>
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