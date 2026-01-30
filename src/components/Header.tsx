import { type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TextPressure from '../components/TextPressure';

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

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  return (
    /* ================= HEADER WRAPPER ================= */
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
        overflow: 'hidden',
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
            <MessageCircle className="w-7 h-7 text-white group-hover:text-[#d4af37] transition-colors " style={{marginLeft: '0.5rem'}}/>
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
  );
};

export default Header;
