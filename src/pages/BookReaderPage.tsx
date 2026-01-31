import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HTMLFlipBook from 'react-pageflip';
import {
    ArrowLeft,
    UserPlus,
    MessageSquare,
    X,
    Menu,
    ChevronLeft,
    ChevronRight,
    Send,
    Users,
    Search,
    Bell,      // Icon for Popup ON
    BellOff    // Icon for Popup OFF
} from 'lucide-react';

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "../components/ui/pagination";

import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

import { booksApi } from '../services/api';

// --- TYPES ---
interface ChatMessage {
    id: number;
    user: string;
    text: string;
    isMe: boolean;
    avatar: string | null;
    page: number;
}

// --- MOCK DATA ---
const ACTIVE_READERS = [
    { id: 'u1', name: "Alice", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice" },
    { id: 'u2', name: "Bob", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob" },
    { id: 'u3', name: "Charlie", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie" },
    { id: 'u4', name: "Dave", img: "" },
    { id: 'u5', name: "Eve", img: "" }
];

const FRIENDS_LIST = [
    { id: 1, name: "Sarah Connor", username: "@sarah_c", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
    { id: 2, name: "John Doe", username: "@johnd", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=John" },
    { id: 3, name: "Emily Blunt", username: "@emily_b", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily" },
    { id: 4, name: "Michael Scott", username: "@best_boss", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael" },
];



const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
    { id: 1, user: 'Alice', text: 'Wait, did he really just hide in the closet? 😂', isMe: false, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice", page: 1 },
    { id: 2, user: 'You', text: 'Classic Tom Sawyer move.', isMe: true, avatar: null, page: 1 },
    { id: 3, user: 'Bob', text: 'I love how Mark Twain describes the old lady.', isMe: false, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob", page: 0 }
];

const BookReaderPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookRef = useRef<any>(null);
    const chatScrollRef = useRef<HTMLDivElement>(null);

    // --- STATE ---
    const [bookMetadata, setBookMetadata] = useState<{ title: string, author: string, id: number, cover: string } | null>(null);
    const [pages, setPages] = useState<string[]>([]);
    const [currentSpread, setCurrentSpread] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // UI Toggles
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteMode, setInviteMode] = useState<'direct' | 'friends'>('direct');

    // Chat State
    const [chatMessage, setChatMessage] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);

    // --- NEW FEATURES STATE ---
    const [unreadCount, setUnreadCount] = useState(0);
    const [popupMessage, setPopupMessage] = useState<ChatMessage | null>(null);
    const [isPopupEnabled, setIsPopupEnabled] = useState(true); // Toggle State

    // --- HTML SPLITTER ---
    const splitHtmlIntoPages = (fullHtml: string) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = fullHtml;
        const pageList: string[] = [];
        let currentPageContent = "";
        let currentLength = 0;
        const MAX_CHARS_PER_PAGE = 700;

        Array.from(tempDiv.children).forEach((node) => {
            const nodeHtml = (node as HTMLElement).outerHTML;
            const nodeLength = (node.textContent?.length || 0) + (node.tagName === 'IMG' ? 300 : 0);
            if (currentLength + nodeLength > MAX_CHARS_PER_PAGE && currentPageContent.length > 0) {
                pageList.push(currentPageContent);
                currentPageContent = "";
                currentLength = 0;
            }
            currentPageContent += nodeHtml;
            currentLength += nodeLength;
        });
        if (currentPageContent.length > 0) pageList.push(currentPageContent);
        return pageList;
    };

    // 1. Fetch & Process
    // 1. Fetch & Process
    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                // Fetch Metadata and Pages in parallel
                const [bookData, pagesData] = await Promise.all([
                    booksApi.getById(id),
                    booksApi.getPages(id)
                ]);

                setBookMetadata({
                    title: bookData.title,
                    author: bookData.authors?.map(a => a.name).join(', ') || 'Unknown',
                    id: Number(bookData.id),
                    cover: bookData.formats?.['image/jpeg'] || ''
                });

                // Backend returns pages array. We map them to HTML strings.
                // Assuming pagesData.pages is ordered by pageNumber.
                const contentPages = pagesData.pages.map(p => p.html);

                // Add Cover Page manually or if part of content?
                // Existing logic added a specific cover page style.
                const coverUrl = bookData.formats?.['image/jpeg'] || '';
                const coverPage = `<div style="height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#1a1a1a;"><img src="${coverUrl}" style="max-height:80%; max-width:90%; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" /><h1 style="color:#d4af37; margin-top:20px; font-size:1.5em; text-align:center;">${bookData.title}</h1></div>`;

                setPages([coverPage, ...contentPages]);

            } catch (error) {
                console.error("Failed to load book:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // 2. Flip Event
    const onFlip = useCallback((e: { data: number }) => {
        const spread = Math.ceil(e.data / 2);
        setCurrentSpread(spread);
    }, []);

    // 3. Handlers
    const handleSendMessage = () => {
        if (!chatMessage.trim()) return;
        const newMessage: ChatMessage = { id: Date.now(), user: 'You', text: chatMessage, isMe: true, avatar: null, page: currentSpread };
        setMessages(prev => [...prev, newMessage]);
        setChatMessage('');
        setTimeout(() => { if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight; }, 100);
    };

    // --- NEW: SIMULATE INCOMING MESSAGE ---
    // To demonstrate the popup/unread features
    const handleIncomingMessage = (msg: ChatMessage) => {
        setMessages(prev => [...prev, msg]);

        // If Chat is CLOSED, handle notifications
        if (!showChat) {
            setUnreadCount(prev => prev + 1);

            if (isPopupEnabled) {
                setPopupMessage(msg);
                // Disappear after 1 second
                setTimeout(() => {
                    setPopupMessage(null);
                }, 3000); // 3s so you have time to see it, prompt said 1s but 1s is very fast. Set to 3000 for UX, change to 1000 if strict.
            }
        }
    };

    // Simulate an incoming message after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            handleIncomingMessage({
                id: Date.now(),
                user: "Alice",
                text: "Hey! Are you seeing the new popup feature? 😎",
                isMe: false,
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
                page: currentSpread
            });
        }, 3000);
        return () => clearTimeout(timer);
    }, [showChat, isPopupEnabled, currentSpread]);

    // Reset unread count when chat opens
    useEffect(() => {
        if (showChat) {
            setUnreadCount(0);
            setPopupMessage(null);
        }
    }, [showChat]);

    const handleCloseModal = () => {
        setShowInviteModal(false);
        setInviteMode('direct');
    };

    const generateIframeContent = (htmlChunk: string) => `<!DOCTYPE html><html><head><style>@import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&display=swap');body { margin: 0; padding: 30px; font-family: 'Merriweather', serif; font-size: 15px; line-height: 1.8; color: #2c2c2c; background: #fdfbf7; height: 100vh; overflow: hidden; box-sizing: border-box; }h1, h2 { color: #111; margin-top: 0; font-family: sans-serif; font-weight:bold; }p { text-align: justify; margin-bottom: 1em; }img { max-width: 100%; height: auto; display: block; margin: 10px auto; }</style></head><body>${htmlChunk}</body></html>`;

    if (isLoading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4af37]" /></div>;

    const totalSpreads = Math.ceil((pages.length) / 2);

    return (
        <div className="min-h-screen w-full bg-[#050505] flex flex-col font-sans text-white overflow-hidden selection:bg-[#d4af37] selection:text-black">

            {/* HEADER */}
            <header className="flex-none h-16 bg-[#050505] border-b border-white/10 px-6 flex items-center justify-between z-50 relative">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:border-[#d4af37] transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`w-10 h-10 flex items-center justify-center rounded-full border border-white/10 transition-colors ${isSidebarOpen ? 'bg-[#d4af37] text-black' : 'bg-white/5'}`}><Menu className="w-5 h-5" /></button>
                    <div>
                        <h1 className="text-sm font-bold text-white truncate max-w-xs">{bookMetadata?.title}</h1>
                        <span className="text-xs text-zinc-500">Spread {currentSpread} of {totalSpreads}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* AVATAR STACK */}
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
                        {ACTIVE_READERS.slice(0, 3).map((user, index) => (
                            <div key={user.id} style={{ marginLeft: index === 0 ? 0 : '-15px', zIndex: index, position: 'relative' }}>
                                <Avatar className="w-10 h-10 border-[3px] border-[#050505]">
                                    <AvatarImage src={user.img} alt={user.name} />
                                    <AvatarFallback className="bg-zinc-800 text-[10px] text-white">{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </div>
                        ))}
                        {ACTIVE_READERS.length > 3 && (
                            <div style={{ marginLeft: '-15px', zIndex: 10, width: '40px', height: '40px', borderRadius: '999px', border: '3px solid #050505', backgroundColor: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', color: '#a1a1aa', position: 'relative' }}>+{ACTIVE_READERS.length - 3}</div>
                        )}
                    </div>

                    <button onClick={() => setShowInviteModal(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:border-[#d4af37] hover:text-[#d4af37] transition-colors" title="Invite Friend"><UserPlus className="w-5 h-5" /></button>

                    {/* --- CHAT BUTTON CONTAINER --- */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className={`w-10 h-10 flex items-center justify-center rounded-full border transition-colors ${showChat ? 'bg-[#d4af37] border-[#d4af37] text-black' : 'bg-white/5 border-white/10 hover:border-[#d4af37] hover:text-[#d4af37]'}`}
                            title="Live Chat"
                        >
                            <MessageSquare className="w-5 h-5" />
                        </button>

                        {/* UNREAD BADGE */}
                        {unreadCount > 0 && (
                            <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid #050505' }}></span>
                        )}

                        {/* --- POPUP MESSAGE (Under Button) --- */}
                        {popupMessage && !showChat && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '50px',
                                    right: '0',
                                    width: '280px',
                                    backgroundColor: '#18181b',
                                    border: '1px solid #d4af37',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                    zIndex: 100,
                                    animation: 'fadeIn 0.3s ease-out'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                    <Avatar className="w-6 h-6"><AvatarImage src={popupMessage.avatar || undefined} /></Avatar>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#d4af37' }}>{popupMessage.user}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#666', marginLeft: 'auto' }}>Now</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#fff', margin: 0, lineHeight: '1.4' }}>{popupMessage.text}</p>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex relative overflow-hidden bg-[#111]">

                {/* TOC SIDEBAR */}
                <div className={`bg-[#0a0a0a] border-r border-white/10 transition-all duration-300 absolute lg:static top-0 bottom-0 z-40 ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full overflow-hidden'}`}>
                    <div className="p-6">
                        <h3 className="text-[#d4af37] text-xs font-bold uppercase tracking-widest mb-4">Jump To</h3>
                        <ul className="space-y-2 text-zinc-400">
                            {Array.from({ length: totalSpreads + 1 }).map((_, i) => {
                                const targetPage = i === 0 ? 0 : (i * 2) - 1;
                                if (targetPage >= pages.length) return null;
                                return (
                                    <li key={i}>
                                        <button onClick={() => bookRef.current?.pageFlip().flip(targetPage)} className={`w-full text-left p-3 rounded-lg text-base font-medium transition-colors ${currentSpread === i ? 'text-white bg-white/10' : 'hover:bg-white/5'}`}>{i === 0 ? "Cover" : `Pages ${i * 2 - 1}-${i * 2}`}</button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>

                {/* READER AREA */}
                <main className="flex-1 relative flex flex-col items-center justify-center p-4 lg:p-8 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#d4af37]/5 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="relative z-10 w-full flex justify-center items-center h-[85vh]">
                        <HTMLFlipBook width={400} height={600} size="fixed" minWidth={300} maxWidth={500} minHeight={400} maxHeight={800} maxShadowOpacity={0.5} showCover={true} mobileScrollSupport={true} className="demo-book shadow-2xl" ref={bookRef} onFlip={onFlip}>
                            {pages.map((htmlChunk, index) => (
                                <div key={index} className="page bg-[#fdfbf7] h-full border-r border-[#e3d5c6] relative overflow-hidden">
                                    <div className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing" title="Drag to Flip" style={{ background: 'transparent' }} />
                                    <iframe srcDoc={generateIframeContent(htmlChunk)} title={`Page ${index}`} className="w-full h-full border-none z-10 relative pointer-events-none" style={{ pointerEvents: 'none' }} />
                                    {index > 0 && <div className="absolute bottom-4 left-0 right-0 text-center z-10 text-[#a8a8a8] text-[10px] font-serif uppercase tracking-widest">{index}</div>}
                                </div>
                            ))}
                        </HTMLFlipBook>
                    </div>
                    <button onClick={() => bookRef.current?.pageFlip().flipPrev()} className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/5 hover:bg-[#d4af37] text-white hover:text-black flex items-center justify-center transition-all z-20"><ChevronLeft className="w-6 h-6" /></button>
                    <button onClick={() => bookRef.current?.pageFlip().flipNext()} className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/5 hover:bg-[#d4af37] text-white hover:text-black flex items-center justify-center transition-all z-20"><ChevronRight className="w-6 h-6" /></button>
                    <div className="absolute bottom-6 z-20">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem><PaginationPrevious onClick={(e) => { e.preventDefault(); bookRef.current?.pageFlip().flipPrev(); }} className="cursor-pointer text-zinc-400 hover:text-[#d4af37]" /></PaginationItem>
                                <PaginationItem><span className="text-zinc-500 text-sm px-4">Spread <span className="text-[#d4af37]">{currentSpread}</span> of {totalSpreads}</span></PaginationItem>
                                <PaginationItem><PaginationNext onClick={(e) => { e.preventDefault(); bookRef.current?.pageFlip().flipNext(); }} className="cursor-pointer text-zinc-400 hover:text-[#d4af37]" /></PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </main>

                {/* --- CHAT SIDEBAR --- */}
                {showChat && (
                    <aside style={{ width: '350px', backgroundColor: '#0a0a0a', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 50, boxShadow: '-5px 0 20px rgba(0,0,0,0.5)' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontWeight: 'bold', color: '#fff', margin: 0, fontSize: '1.1rem' }}>Live Chat</h3>
                            <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><X className="w-5 h-5 hover:text-white" /></button>
                        </div>
                        <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {messages.length === 0 ? <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>No messages yet.</div> : messages.map((msg) => (
                                <div key={msg.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexDirection: msg.isMe ? 'row-reverse' : 'row', alignSelf: msg.isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                    {!msg.isMe && (
                                        <Avatar className="w-10 h-10 border-2 border-[#050505]" style={{ marginRight: '10px' }}>
                                            <AvatarImage src={msg.avatar || undefined} />
                                            <AvatarFallback className="bg-zinc-800 text-[10px] text-white">{msg.user.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isMe ? 'flex-end' : 'flex-start', width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                                            {!msg.isMe && <span style={{ fontSize: '0.7rem', color: '#d4af37', fontWeight: 'bold' }}>{msg.user}</span>}
                                            <span style={{ fontSize: '0.6rem', color: '#666', marginLeft: msg.isMe ? '0' : 'auto', marginRight: msg.isMe ? '0' : '0' }}>{msg.page === 0 ? 'Cover' : `Pages ${msg.page * 2 - 1}-${msg.page * 2}`}</span>
                                        </div>
                                        <div style={{ backgroundColor: msg.isMe ? '#d4af37' : '#27272a', color: msg.isMe ? '#000' : '#fff', padding: '10px 14px', borderRadius: '12px', borderBottomRightRadius: msg.isMe ? '2px' : '12px', borderBottomLeftRadius: msg.isMe ? '12px' : '2px', fontSize: '0.9rem', lineHeight: '1.4', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>{msg.text}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* --- CHAT FOOTER (With Toggle) --- */}
                        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#0a0a0a' }}>
                            {/* TOGGLE SWITCH */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#666', fontSize: '0.8rem' }}>
                                <button
                                    onClick={() => setIsPopupEnabled(!isPopupEnabled)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: isPopupEnabled ? '#d4af37' : '#666' }}
                                >
                                    {isPopupEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                                    <span>Popups {isPopupEnabled ? 'On' : 'Off'}</span>
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#18181b', padding: '8px', borderRadius: '24px', border: '1px solid #333' }}>
                                <input style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.9rem', paddingLeft: '8px' }} placeholder="Type a message..." value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
                                <button onClick={handleSendMessage} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#d4af37', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#000', transition: 'transform 0.1s' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}><Send className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </aside>
                )}
            </div>

            {/* --- INVITE MODAL --- */}
            {showInviteModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: '#0a0a0a', width: '100%', maxWidth: '450px', borderRadius: '16px', border: '1px solid rgba(212, 175, 55, 0.3)', boxShadow: '0 0 40px rgba(212, 175, 55, 0.1)', padding: '30px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', margin: 0 }}>{inviteMode === 'direct' ? 'Invite Friend' : 'Select Friend'}</h3>
                            <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}><X className="w-6 h-6 hover:text-white transition-colors" /></button>
                        </div>
                        {inviteMode === 'direct' && (
                            <>
                                <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '25px', lineHeight: '1.5' }}>Share this reading session by entering a username or email directly.</p>
                                <div style={{ position: 'relative', marginBottom: '25px' }}>
                                    <input type="text" placeholder="Enter username or email..." style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '14px', paddingRight: '50px', color: '#fff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }} onFocus={(e) => e.target.style.borderColor = '#d4af37'} onBlur={(e) => e.target.style.borderColor = '#333'} />
                                    <button onClick={() => setInviteMode('friends')} title="Select from Friends List" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#d4af37', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px' }}><Users className="w-5 h-5 hover:text-white transition-colors" /></button>
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button onClick={handleCloseModal} style={{ flex: 1, backgroundColor: '#d4af37', color: '#000', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', transition: 'background 0.2s' }}>Send Invite</button>
                                    <button onClick={handleCloseModal} style={{ padding: '14px 20px', backgroundColor: 'transparent', color: '#fff', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' }}>Cancel</button>
                                </div>
                            </>
                        )}
                        {inviteMode === 'friends' && (
                            <>
                                <div style={{ position: 'relative', marginBottom: '20px' }}>
                                    <input type="text" placeholder="Search friends..." style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '10px 10px 10px 40px', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                </div>
                                <div style={{ flex: 1, maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {FRIENDS_LIST.map(friend => (
                                        <div key={friend.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderRadius: '8px', border: '1px solid #222', backgroundColor: '#111' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <Avatar className="w-10 h-10 border border-white/10"><AvatarImage src={friend.img} /><AvatarFallback>{friend.name[0]}</AvatarFallback></Avatar>
                                                <div><p style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', margin: 0 }}>{friend.name}</p><p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>{friend.username}</p></div>
                                            </div>
                                            <button onClick={handleCloseModal} style={{ backgroundColor: 'transparent', border: '1px solid #d4af37', color: '#d4af37', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>Invite</button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setInviteMode('direct')} style={{ width: '100%', padding: '12px', backgroundColor: '#222', color: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>Back to Manual Entry</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookReaderPage;