import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    MoreVertical,
    Send,
    Check,
    CheckCheck,
    UserX,
    Ban,
    Trash2,
    Loader2
} from 'lucide-react';
import TextPressure from '../components/TextPressure';
import { chatApi, authApi, type User, type Message } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import lp from '@/assets/lp.jpg';

interface UIMessage {
    id: string; // unique ID
    text: string;
    sender: 'me' | 'them';
    time: string;
    status: 'sending' | 'sent' | 'read';
    rawDate: Date; // useful for sorting
}

const ChatPage = () => {
    const { user: currentUser, defaultAvatar, handleAvatarError } = useAuth();
    const { socket } = useSocket();
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // State
    const [activeUser, setActiveUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<UIMessage[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination State
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // 1. Initialize Chat
    useEffect(() => {
        const initChat = async () => {
            if (!username || !currentUser) return;
            setIsLoading(true);
            setError(null);

            try {
                // Resolve user
                const users = await authApi.searchUsers(username);
                const target = users.find(u => u.username.toLowerCase() === username.toLowerCase());

                if (!target) {
                    setError("User not found");
                    setIsLoading(false);
                    return;
                }
                setActiveUser(target);

                // Get conversation ID
                const { conversationId: cid } = await chatApi.initiatePrivateChat(currentUser.id, target.id);
                console.log("🟦 [ChatPage] Resolved Conversation ID:", cid);
                console.log("🟦 [ChatPage] Me:", currentUser.username, "(", currentUser.id, ")");
                console.log("🟦 [ChatPage] Target:", target.username, "(", target.id, ")");
                setConversationId(cid);

                // Load initial history
                const history = await chatApi.getPrivateMessages(cid, 50);

                // Map to UI
                const mapped = history.messages.map((msg: Message) => ({
                    id: msg.message_id,
                    text: msg.content,
                    sender: msg.sender_id === currentUser.id ? 'me' : 'them',
                    time: new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: 'read',
                    rawDate: new Date(msg.sent_at)
                }) as UIMessage); // Type assertion needed until backend aligns perfectly

                // Backend returns desc (newest first)? We need oldest first for chat view
                // Actually assuming backend returns oldest -> newest or we reverse here.
                // Let's sort manually to be safe.
                mapped.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

                setMessages(mapped);
                setHasMore(history.hasMore);

                // Join Socket Room
                if (socket) {
                    console.log("🟦 [ChatPage] Emitting join_private_chat for:", cid);
                    socket.emit('join_private_chat', cid);
                } else {
                    console.warn("🟧 [ChatPage] Socket not available during initChat");
                }

            } catch (err) {
                console.error("Chat init error:", err);
                setError("Failed to load chat");
            } finally {
                setIsLoading(false);
            }
        };

        initChat();
    }, [username, currentUser, socket]);

    // 2. Real-time Listeners
    useEffect(() => {
        if (!socket || !conversationId) return;

        const handleReceive = (msg: Message) => {
            console.log("🟦 [ChatPage] Received message:", msg);
            // Check if this message belongs to current chat
            if (msg.conversation_id !== conversationId) {
                console.log("🟧 [ChatPage] Ignored message for diff conversation:", msg.conversation_id);
                return;
            }

            setMessages(prev => {
                // 1. Deduplicate by DB ID
                if (prev.some(m => m.id === msg.message_id)) return prev;

                const isMe = msg.sender_id === currentUser?.id;

                // 2. If it's my message, try to find the optimistic "sending" message to replace
                if (isMe) {
                    const pendingIndex = prev.findIndex(m =>
                        m.status === 'sending' &&
                        m.sender === 'me' &&
                        m.text === msg.content
                    );

                    if (pendingIndex !== -1) {
                        const newMessages = [...prev];
                        newMessages[pendingIndex] = {
                            id: msg.message_id,
                            text: msg.content,
                            sender: 'me',
                            time: new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            status: 'sent', // Mark as confirmed
                            rawDate: new Date(msg.sent_at)
                        };
                        return newMessages;
                    }
                }

                // 3. Otherwise append new message
                const newUIMsg: UIMessage = {
                    id: msg.message_id,
                    text: msg.content,
                    sender: isMe ? 'me' : 'them',
                    time: new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: 'read',
                    rawDate: new Date(msg.sent_at)
                };

                return [...prev, newUIMsg];
            });
        };

        socket.on('receive_private_message', handleReceive);

        return () => {
            socket.off('receive_private_message', handleReceive);
        };
    }, [socket, conversationId, currentUser?.id]);

    // 3. Scroll to Bottom on Load / Receive
    useEffect(() => {
        if (!isLoadingMore) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoadingMore]);

    // 4. Send Message
    const handleSend = () => {
        if (!newMessage.trim() || !currentUser || !conversationId || !socket) return;

        const content = newMessage;
        setNewMessage(''); // Clear input immediately

        // Optimistic UI Update
        const tempId = `temp-${Date.now()}`;
        const tempMsg: UIMessage = {
            id: tempId,
            text: content,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sending',
            rawDate: new Date()
        };

        setMessages(prev => [...prev, tempMsg]);

        console.log("🟦 [ChatPage] Sending message:", content, "to ConvID:", conversationId);
        // Emit Socket Event
        socket.emit('send_private_message', {
            conversation_id: conversationId,
            sender_id: currentUser.id,
            content: content
        });

        // Note: The 'receive_private_message' event (showing confirmation) 
        // will handle replacing this or confirming it if the backend echoes back.
        // For now we rely on the echo.
    };

    // 5. Load More (Infinite Scroll)
    const handleScroll = async () => {
        if (!messagesContainerRef.current || !hasMore || isLoadingMore || !conversationId) return;

        const { scrollTop } = messagesContainerRef.current;
        if (scrollTop === 0) {
            setIsLoadingMore(true);
            const oldestMsg = messages[0];

            try {
                // Fetch older messages
                const history = await chatApi.getPrivateMessages(conversationId, 50, oldestMsg.rawDate.toISOString());

                if (history.messages.length > 0) {
                    const mapped = history.messages.map((msg: Message) => ({
                        id: msg.message_id,
                        text: msg.content,
                        sender: msg.sender_id === currentUser?.id ? 'me' : 'them',
                        time: new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        status: 'read',
                        rawDate: new Date(msg.sent_at)
                    }) as UIMessage);

                    mapped.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

                    setMessages(prev => [...mapped, ...prev]);
                    setHasMore(history.hasMore);

                    // Maintain scroll position (rough adjustment)
                    if (messagesContainerRef.current) {
                        // This is tricky without exact heights, but simple method:
                        // User will jump slightly, standard for simple implementation
                        messagesContainerRef.current.scrollTop = 50;
                    }
                } else {
                    setHasMore(false);
                }
            } catch (err) {
                console.error("Failed to load older messages", err);
            } finally {
                setIsLoadingMore(false);
            }
        }
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

    if (error) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white gap-4">
                <p className="text-xl text-red-500">{error}</p>
                <button onClick={() => navigate('/chats')} className="text-[#d4af37] underline">Back to Chats</button>
            </div>
        );
    }

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
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
                        backgroundImage: `url(${lp})`,
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
                                        src={activeUser.avatar || defaultAvatar}
                                        alt={activeUser.username}
                                        onError={handleAvatarError}
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
                <main
                    className="no-scrollbar"
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        backgroundColor: 'transparent'
                    }}
                >
                    {isLoadingMore && (
                        <div className="flex justify-center w-full py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-[#d4af37]" />
                        </div>
                    )}

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
                                                {msg.status === 'read' ? <CheckCheck size={14} /> : (msg.status === 'sent' ? <Check size={14} /> : null)}
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
                                    borderRadius: '9999px',
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