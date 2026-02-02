import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
    Bell,
    BellOff,
    Loader2
} from 'lucide-react';

import {
    Pagination,
    PaginationContent,
    PaginationItem,
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

const BATCH_SIZE = 20;

const BookReaderPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookRef = useRef<any>(null);
    const chatScrollRef = useRef<HTMLDivElement>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // --- STATE ---
    const [bookMetadata, setBookMetadata] = useState<{ title: string, author: string, id: number, cover: string } | null>(null);
    const [pages, setPages] = useState<(string | null)[]>([]);
    const [totalPagesCount, setTotalPagesCount] = useState(0);
    const [currentSpread, setCurrentSpread] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingBatch, setIsFetchingBatch] = useState(false);

    // INGESTION STATE
    const [isIngesting, setIsIngesting] = useState(false);
    const [ingestionMessage, setIngestionMessage] = useState('');

    // UI Toggles
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteMode, setInviteMode] = useState<'direct' | 'friends'>('direct');

    // Chat State
    const [chatMessage, setChatMessage] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);

    // Notifications
    const [unreadCount, setUnreadCount] = useState(0);
    const [popupMessage, setPopupMessage] = useState<ChatMessage | null>(null);
    const [isPopupEnabled, setIsPopupEnabled] = useState(true);

    // Poll Ingestion Status
    const pollIngestionStatus = useCallback(async () => {
        if (!id) return;
        try {
            const status = await booksApi.getIngestionStatus(id);
            console.log('[Poll] Ingestion status:', status);

            if (status.status === 'complete') {
                // Ingestion done - reload pages
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                }
                setIsIngesting(false);
                
                // Fetch pages now
                const pagesData = await booksApi.getPages(id, BATCH_SIZE, 0);
                if (pagesData.total_pages > 0 && pagesData.pages?.length > 0) {
                    setTotalPagesCount(pagesData.total_pages);
                    const totalSlots = pagesData.total_pages + 1;
                    const initPages = new Array(totalSlots).fill(null);
                    initPages[0] = pages[0]; // Keep existing cover
                    pagesData.pages.forEach((p: any, i: number) => {
                        initPages[i + 1] = p.html;
                    });
                    setPages(initPages);
                }
            } else if (status.status === 'failed') {
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                }
                setIngestionMessage(`Failed: ${status.error}`);
            } else {
                setIngestionMessage(status.message || 'Processing...');
            }
        } catch (error) {
            console.error('[Poll] Error:', error);
        }
    }, [id, pages]);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    // 1. Initial Fetch - FIXED dependency array
    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setIsLoading(true);

            try {
                const bookData = await booksApi.getById(id);

                const coverUrl = bookData.formats?.['image/jpeg'] || '';
                const coverPage = `<div style="height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#1a1a1a;"><img src="${coverUrl}" style="max-height:80%; max-width:90%; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" /><h1 style="color:#d4af37; margin-top:20px; font-size:1.5em; text-align:center;">${bookData.title}</h1></div>`;

                setBookMetadata({
                    title: bookData.title,
                    author: bookData.authors?.map((a: any) => a.name).join(', ') || 'Unknown',
                    id: Number(bookData.id),
                    cover: coverUrl
                });

                const pagesData = await booksApi.getPages(id, BATCH_SIZE, 0);

                console.log('=== DEBUG pagesData ===');
                console.log('_httpStatus:', pagesData._httpStatus);
                console.log('total_pages:', pagesData.total_pages);
                console.log('pages length:', pagesData.pages?.length);

                if (pagesData._httpStatus === 202) {
                    setIsIngesting(true);
                    setIngestionMessage(pagesData.message || 'Book is being prepared...');
                    setPages([coverPage]);
                    setTotalPagesCount(0);

                    if (!pollIntervalRef.current) {
                        pollIntervalRef.current = setInterval(pollIngestionStatus, 3000);
                    }
                } else if (pagesData.total_pages > 0 && pagesData.pages && pagesData.pages.length > 0) {
                    console.log('>>> SUCCESS - Loading', pagesData.total_pages, 'pages');
                    setTotalPagesCount(pagesData.total_pages);

                    const totalSlots = pagesData.total_pages + 1;
                    const initPages = new Array(totalSlots).fill(null);
                    initPages[0] = coverPage;

                    pagesData.pages.forEach((p: any, i: number) => {
                        initPages[i + 1] = p.html;
                    });

                    setPages(initPages);
                    setIsIngesting(false);
                } else {
                    setIsIngesting(true);
                    setIngestionMessage('Preparing book pages...');
                    setPages([coverPage]);

                    if (!pollIntervalRef.current) {
                        pollIntervalRef.current = setInterval(pollIngestionStatus, 3000);
                    }
                }

            } catch (error) {
                console.error("Failed to load book:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]); // <-- REMOVED pollIngestionStatus from dependencies!
    // 2. Load Specific Batch Logic
    const loadBatch = async (offsetIndex: number) => {
        if (!id || isFetchingBatch) return;
        if (pages[offsetIndex + 1] !== null) return;

        setIsFetchingBatch(true);
        console.log(`Fetching batch starting at ${offsetIndex}...`);

        try {
            const data = await booksApi.getPages(id, BATCH_SIZE, offsetIndex);

            setPages(prev => {
                const next = [...prev];
                data.pages.forEach((p: any, i: number) => {
                    const targetIndex = offsetIndex + i + 1;
                    if (targetIndex < next.length) {
                        next[targetIndex] = p.html;
                    }
                });
                return next;
            });

        } catch (error) {
            console.error("Error loading batch:", error);
        } finally {
            setIsFetchingBatch(false);
        }
    };

    // 3. Trigger Load More based on Scroll/Flip position
    useEffect(() => {
        if (!pages.length || isIngesting) return;

        const currentPageIndex = currentSpread * 2;
        const nextBatchStart = Math.ceil(currentPageIndex / BATCH_SIZE) * BATCH_SIZE;
        const PRELOAD_THRESHOLD = 5;

        if (
            !isLoading &&
            !isFetchingBatch &&
            nextBatchStart < pages.length &&
            (nextBatchStart - currentPageIndex) <= PRELOAD_THRESHOLD &&
            pages[nextBatchStart + 1] === null
        ) {
            loadBatch(nextBatchStart);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSpread, pages, isFetchingBatch, isLoading, isIngesting]);

    // 4. Flip Event
    const onFlip = useCallback((e: { data: number }) => {
        const spread = Math.ceil(e.data / 2);
        setCurrentSpread(spread);
    }, []);

    // 5. Sidebar Jump Logic
    const handleJumpTo = async (targetIndex: number) => {
        if (targetIndex === 0) {
            bookRef.current?.pageFlip().flip(0);
            return;
        }

        const batchStart = Math.floor((targetIndex - 1) / BATCH_SIZE) * BATCH_SIZE;

        if (pages[targetIndex] === null) {
            await loadBatch(batchStart);
        }

        bookRef.current?.pageFlip().flip(targetIndex);
    };

    // Chat Handlers
    const handleSendMessage = () => {
        if (!chatMessage.trim()) return;
        const newMessage: ChatMessage = { id: Date.now(), user: 'You', text: chatMessage, isMe: true, avatar: null, page: currentSpread };
        setMessages(prev => [...prev, newMessage]);
        setChatMessage('');
        setTimeout(() => { if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight; }, 100);
    };

    const handleIncomingMessage = (msg: ChatMessage) => {
        setMessages(prev => [...prev, msg]);
        if (!showChat) {
            setUnreadCount(prev => prev + 1);
            if (isPopupEnabled) {
                setPopupMessage(msg);
                setTimeout(() => { setPopupMessage(null); }, 3000);
            }
        }
    };

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    // Loading Page Component
    const LoadingPage = ({ number }: { number: number }) => (
        <div className="h-full w-full bg-[#fdfbf7] border-r border-[#e3d5c6] flex flex-col items-center justify-center relative">
            <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin mb-4" />
            <span className="text-zinc-400 text-xs font-serif tracking-widest">LOADING PAGE {number}</span>
            <div className="absolute bottom-4 left-0 right-0 text-center text-[#a8a8a8] text-[10px]">{number}</div>
        </div>
    );

    // Generate iframe content
    const generateIframeContent = useCallback((htmlChunk: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            margin: 0; 
            padding: 30px 35px; 
            font-family: 'Merriweather', Georgia, serif; 
            font-size: 12px;
            line-height: 1.7;
            color: #2c2c2c; 
            background: #fdfbf7; 
            height: 100vh; 
            overflow: hidden;
        }
        h1, h2 { display: none !important; }
        h3, h4, h5, h6 { color: #333; margin-top: 1em; margin-bottom: 0.4em; font-size: 1.1em; }
        p { 
            text-align: justify; 
            margin-bottom: 0.9em; 
            text-indent: 1.2em;
        }
        p:first-of-type { text-indent: 0; }
        p:first-of-type::first-letter {
            font-size: 2.5em;
            float: left;
            line-height: 0.8;
            padding-right: 6px;
            padding-top: 3px;
            color: #8B7355;
        }
        img { 
            max-width: 90%; 
            max-height: 150px; 
            display: block; 
            margin: 10px auto; 
            border-radius: 4px;
            object-fit: contain;
        }
       
        blockquote {
            border-left: 2px solid #d4af37;
            margin: 1em 0;
            padding: 0.3em 1em;
            font-style: italic;
            color: #555;
            font-size: 0.95em;
        }
        em, i { font-style: italic; }
        strong, b { font-weight: 700; }
        hr { border: none; height: 1px; background: linear-gradient(to right, transparent, #ccc, transparent); margin: 1.5em 0; }
    </style>
</head>
<body>${htmlChunk}</body>
</html>`, []);

    // Memoize sidebar items
    const sidebarItems = useMemo(() => {
        const items: { label: string; index: number }[] = [];
        if (totalPagesCount > 0) {
            items.push({ label: "Cover", index: 0 });
            for (let i = 0; i < totalPagesCount; i += BATCH_SIZE) {
                items.push({ label: `Page ${i + 1}`, index: i + 1 });
            }
        }
        return items;
    }, [totalPagesCount]);

    // Memoize page contents
    const memoizedPageContents = useMemo(() => {
        return pages.map((htmlChunk) => htmlChunk ? generateIframeContent(htmlChunk) : null);
    }, [pages, generateIframeContent]);

    // LOADING STATE
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4af37]" />
            </div>
        );
    }

    // INGESTION STATE
    if (isIngesting) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
                <Loader2 className="w-16 h-16 text-[#d4af37] animate-spin mb-6" />
                <h2 className="text-2xl font-bold mb-2">Preparing Your Book</h2>
                <p className="text-zinc-400 text-center max-w-md">{ingestionMessage}</p>
                <p className="text-zinc-500 text-sm mt-4">This may take a minute for first-time reads...</p>
            </div>
        );
    }

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

                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className={`w-10 h-10 flex items-center justify-center rounded-full border transition-colors ${showChat ? 'bg-[#d4af37] border-[#d4af37] text-black' : 'bg-white/5 border-white/10 hover:border-[#d4af37] hover:text-[#d4af37]'}`}
                            title="Live Chat"
                        >
                            <MessageSquare className="w-5 h-5" />
                        </button>

                        {unreadCount > 0 && (
                            <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid #050505' }}></span>
                        )}

                        {popupMessage && !showChat && (
                            <div style={{ position: 'absolute', top: '50px', right: '0', width: '280px', backgroundColor: '#18181b', border: '1px solid #d4af37', borderRadius: '12px', padding: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 100, animation: 'fadeIn 0.3s ease-out' }}>
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
                <style>{`
                    .toc-sidebar-list::-webkit-scrollbar { width: 6px; }
                    .toc-sidebar-list::-webkit-scrollbar-track { background: #1a1a1a; border-radius: 3px; }
                    .toc-sidebar-list::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 3px; }
                    .toc-sidebar-list li, .toc-sidebar-list button { overflow: visible !important; }
                    .toc-sidebar-list li::-webkit-scrollbar, .toc-sidebar-list button::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
                `}</style>
                <div
                    style={{
                        position: isSidebarOpen ? 'relative' : 'absolute',
                        left: 0,
                        top: 0,
                        width: isSidebarOpen ? '256px' : '0px',
                        height: 'calc(100vh - 64px)',
                        backgroundColor: '#0a0a0a',
                        borderRight: '1px solid rgba(255,255,255,0.1)',
                        transition: 'all 0.3s',
                        overflow: 'hidden',
                        zIndex: 40,
                        flexShrink: 0,
                    }}
                >
                    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <h3 className="text-[#d4af37] text-xs font-bold uppercase tracking-widest mb-4" style={{ flexShrink: 0 }}>Jump To</h3>
                        <ul
                            className="toc-sidebar-list"
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                margin: 0,
                                padding: 0,
                                listStyle: 'none',
                            }}
                        >
                            {sidebarItems.map((item) => (
                                <li key={item.index} style={{ marginBottom: '4px' }}>
                                    <button
                                        onClick={() => handleJumpTo(item.index)}
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            transition: 'all 0.2s',
                                            border: 'none',
                                            cursor: 'pointer',
                                            backgroundColor: (() => {
                                                const currentPageIndex = currentSpread * 2;
                                                if (item.index === 0) return currentSpread === 0 ? '#d4af37' : 'transparent';
                                                const batchStart = item.index;
                                                const batchEnd = item.index + BATCH_SIZE;
                                                return currentPageIndex >= batchStart && currentPageIndex < batchEnd ? '#d4af37' : 'transparent';
                                            })(),
                                            color: (() => {
                                                const currentPageIndex = currentSpread * 2;
                                                if (item.index === 0) return currentSpread === 0 ? '#000' : '#a1a1aa';
                                                const batchStart = item.index;
                                                const batchEnd = item.index + BATCH_SIZE;
                                                return currentPageIndex >= batchStart && currentPageIndex < batchEnd ? '#000' : '#a1a1aa';
                                            })(),
                                        }}
                                        onMouseEnter={(e) => {
                                            const currentPageIndex = currentSpread * 2;
                                            const isActive = item.index === 0
                                                ? currentSpread === 0
                                                : currentPageIndex >= item.index && currentPageIndex < item.index + BATCH_SIZE;
                                            if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            const currentPageIndex = currentSpread * 2;
                                            const isActive = item.index === 0
                                                ? currentSpread === 0
                                                : currentPageIndex >= item.index && currentPageIndex < item.index + BATCH_SIZE;
                                            if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* READER AREA */}
                <main className="flex-1 relative flex flex-col items-center justify-center p-4 lg:p-8 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#d4af37]/5 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="relative z-10 w-full flex justify-center items-center h-[85vh]">
                        {pages.length > 0 && (
                            <HTMLFlipBook
                                width={400}
                                height={600}
                                size="fixed"
                                minWidth={300}
                                maxWidth={500}
                                minHeight={400}
                                maxHeight={800}
                                maxShadowOpacity={0.5}
                                showCover={true}
                                mobileScrollSupport={true}
                                className="demo-book shadow-2xl"
                                ref={bookRef}
                                onFlip={onFlip}
                            >
                                {memoizedPageContents.map((iframeContent, index) => (
                                    <div key={index} className="page bg-[#fdfbf7] h-full border-r border-[#e3d5c6] relative overflow-hidden">
                                        <div className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing" title="Drag to Flip" style={{ background: 'transparent' }} />

                                        {iframeContent ? (
                                            <>
                                                <iframe srcDoc={iframeContent} title={`Page ${index}`} className="w-full h-full border-none z-10 relative pointer-events-none" style={{ pointerEvents: 'none' }} />
                                                {index > 0 && <div className="absolute bottom-4 left-0 right-0 text-center z-10 text-[#a8a8a8] text-[10px] font-serif uppercase tracking-widest">{index}</div>}
                                            </>
                                        ) : (
                                            <LoadingPage number={index} />
                                        )}
                                    </div>
                                ))}
                            </HTMLFlipBook>
                        )}
                    </div>

                    {isFetchingBatch && (
                        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-[#000]/80 text-[#d4af37] px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border border-[#d4af37]/30 z-50">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Loading next chapter...
                        </div>
                    )}

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

                {/* CHAT SIDEBAR */}
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

                        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#0a0a0a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#666', fontSize: '0.8rem' }}>
                                <button onClick={() => setIsPopupEnabled(!isPopupEnabled)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: isPopupEnabled ? '#d4af37' : '#666' }}>
                                    {isPopupEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                                    <span>Popups {isPopupEnabled ? 'On' : 'Off'}</span>
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#18181b', padding: '8px', borderRadius: '24px', border: '1px solid #333' }}>
                                <input style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.9rem', paddingLeft: '8px' }} placeholder="Type a message..." value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
                                <button onClick={handleSendMessage} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#d4af37', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#000', transition: 'transform 0.1s' }}><Send className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </aside>
                )}

                {/* INVITE MODAL */}
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
                                        <input type="text" placeholder="Enter username or email..." style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '14px', paddingRight: '50px', color: '#fff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }} onFocus={(e) => e.currentTarget.style.borderColor = '#d4af37'} onBlur={(e) => e.currentTarget.style.borderColor = '#333'} />
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
        </div>
    );
};

export default BookReaderPage;