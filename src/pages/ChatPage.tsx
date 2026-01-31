import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    MoreVertical,
    Send,
    Check,
    CheckCheck,
    UserX,
    Ban,
    Trash2
} from 'lucide-react';
import TextPressure from '../components/TextPressure';
import { chatApi, authApi, type User, type Message } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ChatPage = () => {
    // Inside ChatPage component
    const { user: currentUser } = useAuth();
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [activeUser, setActiveUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<any[]>([]); // Using any for UI mapping compatibility temporarily
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Load Data
    useEffect(() => {
        const initChat = async () => {
            if (!username || !currentUser) return;
            setIsLoading(true);
            try {
                // 1. Resolve Target User
                const users = await authApi.searchUsers(username);
                const target = users.find(u => u.username.toLowerCase() === username.toLowerCase());

                if (!target) {
                    console.error("User not found");
                    // Handle not found (redirect or show error)
                    setIsLoading(false);
                    return;
                }
                setActiveUser(target);

                // 2. Initiate/Get Conversation
                const { conversationId } = await chatApi.initiatePrivateChat(currentUser.id, target.id);
                setConversationId(conversationId);

                // 3. Fetch History (if generic REST endpoint exists, otherwise empty)
                // Ignoring if getMessages throws 404 for empty chat
                try {
                    const history = await chatApi.getMessages(conversationId);
                    // Map history to UI format
                    const mappedMessages = history.map((msg: Message) => ({
                        id: msg.id,
                        text: msg.content,
                        sender: msg.senderId === currentUser.id ? 'me' : 'them',
                        time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        status: 'read' // default
                    }));
                    setMessages(mappedMessages);
                } catch (err) {
                    // New conversation might not have messages
                    setMessages([]);
                }

            } catch (error) {
                console.error("Chat init failed:", error);
            } finally {
                setIsLoading(false);
            }
        };
        initChat();
    }, [username, currentUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const handleClick = () => setIsMenuOpen(false);
        if (isMenuOpen) window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [isMenuOpen]);

    // TODO: Implement WebSocket sending. For now, optimistic RESTish update.
    const handleSend = () => {
        if (!newMessage.trim() || !currentUser) return;

        // Optimistic Update
        const tempMsg = {
            id: Date.now(),
            text: newMessage,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sending'
        };
        setMessages(prev => [...prev, tempMsg]);
        setNewMessage('');

        // In a real app with WS, we emit event here.
        // socket.emit('sendMessage', { conversationId, content: newMessage });
        console.warn("WebSocket sending not implemented yet. Message is local only.");
    };

    const handleMenuAction = (action: string) => {
        if (action === 'clear') setMessages([]);
        setIsMenuOpen(false);
    };

    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4af37]" />
            </div>
        );
    }

    return (
        <div style={{
            height: '100vh',
            width: '100%',
            backgroundColor: '#050505',
            position: 'relative',
            overflow: 'hidden'
        }}>

            {/* 1. Added Style block to hide scrollbar */}
            <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>

            {/* --- BACKGROUND PATTERN (Absolute, Z-0) --- */}
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

            {/* 2. CHAT CONTAINER (Absolute Center, Z-10) */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '95%',
                maxWidth: '900px',
                height: '85vh',
                zIndex: 10,
                marginTop: '25rem', // You requested to keep this margin logic

                // Visual Styles
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                boxShadow: '0 0 50px rgba(0, 0, 0, 0.9)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>

                {/* --- CHAT CONTAINER BACKGROUND (Internal) --- */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: -1,
                    pointerEvents: 'none'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage: 'url(/src/assets/lp.jpg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(8px)',
                        transform: 'scale(1.05)'
                    }}></div>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(to bottom, #050505, rgba(5, 5, 5, 0.85), #050505)'
                    }}></div>
                </div>

                {/* --- HEADER --- */}
                <header style={{
                    height: '80px',
                    padding: '0 1.5rem',
                    backgroundColor: 'rgba(5, 5, 5, 0.8)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 20
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => navigate('/chats')}
                            style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: 'none', background: 'transparent', cursor: 'pointer',
                                color: '#a1a1aa'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <ArrowLeft size={20} />
                        </button>

                        {activeUser ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ position: 'relative', width: '44px', height: '44px' }}>
                                    <img
                                        src={activeUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeUser.username}`}
                                        alt={activeUser.username}
                                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                </div>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
                                    {activeUser.username}
                                </h2>
                            </div>
                        ) : (
                            <div className="text-white">User not found</div>
                        )}
                    </div>

                    {/* Hamburger Menu */}
                    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                backgroundColor: isMenuOpen ? '#e0bb3fff' : 'transparent',
                                color: isMenuOpen ? 'black' : '#a1a1aa'
                            }}
                        >
                            <MoreVertical size={20} />
                        </button>

                        {isMenuOpen && (
                            <div style={{
                                position: 'absolute', top: '50px', right: 0,
                                width: '180px', backgroundColor: '#0a0a0a',
                                border: '1px solid #1f1f22', borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                                overflow: 'hidden', zIndex: 50
                            }}>
                                <button onClick={() => handleMenuAction('unfriend')} style={menuItemStyle}>
                                    <UserX size={16} /> Unfriend
                                </button>
                                <button onClick={() => handleMenuAction('block')} style={menuItemStyle}>
                                    <Ban size={16} /> Block
                                </button>
                                <div style={{ height: '1px', backgroundColor: '#1f1f22', margin: '4px 8px' }}></div>
                                <button onClick={() => handleMenuAction('clear')} style={{ ...menuItemStyle, color: '#ef4444' }}>
                                    <Trash2 size={16} /> Clear Chat
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* --- MESSAGES AREA --- */}
                <main className="no-scrollbar" style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    backgroundColor: 'transparent'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <span style={{
                            fontSize: '0.75rem', fontWeight: 'bold', color: '#a1a1aa',
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                            backgroundColor: 'rgba(0,0,0,0.6)', padding: '0.4rem 1rem',
                            borderRadius: '999px', border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            Today
                        </span>
                    </div>

                    {messages.map((msg) => {
                        const isMe = msg.sender === 'me';

                        return (
                            <div key={msg.id} style={{
                                display: 'flex',
                                width: '100%',
                                justifyContent: isMe ? 'flex-end' : 'flex-start'
                            }}>
                                <div style={{
                                    position: 'relative',
                                    maxWidth: '70%',
                                    padding: '1rem 1.25rem',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                                    borderRadius: '20px',
                                    borderTopRightRadius: isMe ? '4px' : '20px',
                                    borderTopLeftRadius: isMe ? '20px' : '4px',
                                    // Updated background for "Me" messages: Transparent Gold + Blur
                                    background: isMe ? 'rgba(235, 192, 51, 0.85)' : 'rgba(24, 24, 27, 0.9)',
                                    backdropFilter: 'blur(8px)',
                                    color: isMe ? 'black' : '#e4e4e7',
                                    border: isMe ? '1px solid rgba(212, 175, 55, 0.2)' : '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', fontWeight: 500 }}>
                                        {msg.text}
                                    </p>

                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                        gap: '0.4rem', marginTop: '0.5rem',
                                        opacity: isMe ? 0.6 : 0.4,
                                        color: 'inherit'
                                    }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                                            {msg.time}
                                        </span>
                                        {isMe && (
                                            <span>
                                                {msg.status === 'read' ? <CheckCheck size={14} /> : <Check size={14} />}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </main>

                {/* --- INPUT AREA --- */}
                <div style={{
                    padding: '1.5rem',
                    backgroundColor: 'rgba(5, 5, 5, 0.8)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type a message..."
                                style={{
                                    width: '100%',
                                    backgroundColor: 'rgba(26, 26, 26, 0.8)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '999px',
                                    padding: '0.9rem 1.5rem',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#d4af37'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                                autoFocus
                            />
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={!newMessage.trim()}
                            style={{
                                width: '52px', height: '52px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: 'none', cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                                backgroundColor: newMessage.trim() ? '#d4af37' : 'rgba(31, 31, 34, 0.8)',
                                color: newMessage.trim() ? 'black' : '#52525b',
                                boxShadow: newMessage.trim() ? '0 0 15px rgba(212,175,55,0.3)' : 'none'
                            }}
                        >
                            <Send size={20} style={{ marginLeft: '2px' }} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

const menuItemStyle = {
    width: '100%',
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontSize: '0.9rem',
    color: '#d4d4d8',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'background 0.2s'
};

export default ChatPage;