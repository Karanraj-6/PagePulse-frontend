import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    UserPlus,
    MessageSquare,
    X,
    Menu,
    Send,
    Users,
    Search,
    Bell,
    BellOff,
    Loader2,
    Check
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { booksApi, userApi, chatApi, authApi, invitationApi, type Book, type User, type Friend } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import BookViewer from '../components/BookViewer';

// --- TYPES ---
interface ChatMessage {
    id: number;
    user: string;
    text: string;
    isMe: boolean;
    avatar: string | null;
    page: number;
    isFriendsOnly?: boolean;  // Added flag
}

// ... existing code ...



// --- MOCK DATA REMOVED ---
// Active readers are now real-time.
// Friends list is fetched from API.


const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
    { id: 1, user: 'Alice', text: 'Wait, did he really just hide in the closet? 😂', isMe: false, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice", page: 1 },
    { id: 2, user: 'You', text: 'Classic Tom Sawyer move.', isMe: true, avatar: null, page: 1 },
    { id: 3, user: 'Bob', text: 'I love how Mark Twain describes the old lady.', isMe: false, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob", page: 0 }
];

const BATCH_SIZE = 20;

const BookReaderPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const { user, defaultAvatar } = useAuth();
    const { socket } = useSocket();

    // Get book from navigation state (passed from SearchPage/BookDetailPage)
    const bookFromState = (location.state as { book?: Book })?.book;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookRef = useRef<any>(null);
    const chatScrollRef = useRef<HTMLDivElement>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // --- STATE ---
    const [bookMetadata, setBookMetadata] = useState<{ title: string, author: string, id: number, cover: string } | null>(null);
    const [pages, setPages] = useState<(string | null)[]>([]);
    const [totalPagesCount, setTotalPagesCount] = useState(0);
    const [currentSpread, setCurrentSpread] = useState(0);
    const currentSpreadRef = useRef(0); // Add ref to fix stale closure in socket
    useEffect(() => { currentSpreadRef.current = currentSpread; }, [currentSpread]);
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
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [showMenu, setShowMenu] = useState(false); // Mobile menu
    const [isFriendsOnly, setIsFriendsOnly] = useState(false); // New Toggle State
    // Friends state for chat filtering & invitations
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set()); // For invitation modal

    // Memoize friend IDs for robust chat filtering
    // Use Ref to avoid socket listener stale closures
    const friendIdsRef = useRef<Set<string>>(new Set());
    const friendUsernamesRef = useRef<Set<string>>(new Set());

    // Effect to update refs when friends change
    useEffect(() => {
        const idSet = new Set(friends.map(f => f.user_id));
        const usernameSet = new Set(friends.map(f => f.username.toLowerCase()));

        friendIdsRef.current = idSet;
        friendUsernamesRef.current = usernameSet;

    }, [friends]);

    // Notifications
    const [unreadCount, setUnreadCount] = useState(0);
    const [popupMessage, setPopupMessage] = useState<ChatMessage | null>(null);
    const [isPopupEnabled, setIsPopupEnabled] = useState(true);

    // Poll Ingestion Status
    const pollIngestionStatus = useCallback(async () => {
        if (!id) return;
        try {
            const status = await booksApi.getIngestionStatus(id);

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

    // Fetch friends for invitations & chat filtering
    useEffect(() => {
        const fetchFriends = async () => {
            if (user?.id) {
                try {
                    const data = await authApi.getFriends(user.id);
                    setFriends(data);
                } catch (error) {
                    console.error("Failed to fetch friends", error);
                }
            }
        };
        fetchFriends();
    }, [user?.id]);

    // 1. Initial Fetch
    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setIsLoading(true);

            try {
                // Try to get book from API, fallback to navigation state
                let bookData: Book | null = null;

                try {
                    bookData = await booksApi.getById(id);
                } catch (err) {
                    if (bookFromState) {
                        bookData = bookFromState;
                    } else {
                        throw err; // Re-throw if we don't have fallback
                    }
                }

                if (!bookData) {
                    console.error("No book data available");
                    setIsLoading(false);
                    return;
                }

                const coverUrl = bookData.formats?.['image/jpeg'] || '';
                const coverPage = `<div style="height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#1a1a1a;"><img src="${coverUrl}" style="max-height:80%; max-width:90%; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" /><h1 style="color:#d4af37; margin-top:20px; font-size:1.5em; text-align:center;">${bookData.title}</h1></div>`;

                setBookMetadata({
                    title: bookData.title,
                    author: bookData.authors?.map((a: any) => a.name).join(', ') || 'Unknown',
                    id: Number(bookData.id),
                    cover: coverUrl
                });

                const pagesData = await booksApi.getPages(id, BATCH_SIZE, 0);

                // Handle 202 = ingestion in progress OR status indicates processing
                const isIngestingBook =
                    pagesData._httpStatus === 202 ||
                    pagesData.status === 'processing' ||
                    pagesData.status === 'started' ||
                    (pagesData.total_pages === 0 && (!pagesData.pages || pagesData.pages.length === 0));

                if (isIngestingBook) {
                    setIsIngesting(true);
                    setIngestionMessage(pagesData.message || 'Book is being prepared. This may take 15-30 seconds...');
                    setPages([coverPage]);
                    setTotalPagesCount(0);

                    // Start polling for ingestion status
                    if (!pollIntervalRef.current) {
                        pollIntervalRef.current = setInterval(pollIngestionStatus, 5000); // Retry every 5 seconds
                    }
                } else if (pagesData.total_pages > 0 && pagesData.pages && pagesData.pages.length > 0) {
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
    }, [id]);

    // 2. Load Specific Batch Logic
    const loadBatch = async (offsetIndex: number) => {
        if (!id || isFetchingBatch) return;
        if (pages[offsetIndex + 1] !== null) return;

        setIsFetchingBatch(true);

        try {
            const data = await booksApi.getPages(id, BATCH_SIZE, offsetIndex);

            if (data._httpStatus === 202 || data.status === 'processing' || data.status === 'started') {
                return;
            }

            if (data.pages && data.pages.length > 0) {
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
            }

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

    // --- SOCKET.IO CHAT INTEGRATION ---
    // Moved hooks to top

    // Active Readers State
    const [activeReaders, setActiveReaders] = useState<User[]>([]);
    const [readerCount, setReaderCount] = useState(0);
    const [showReadersList, setShowReadersList] = useState(false);

    // Fetch user details helper
    const fetchReaderDetails = async (userId: string) => {
        if (!userId) return;
        try {
            // Don't fetch if we already have them
            if (activeReaders.some(r => r.id === userId)) return;

            // Use Chat Service proxy to get user details
            const profile = await chatApi.getChatUser(userId);

            setActiveReaders(prev => {
                if (prev.some(r => r.id === profile.id)) return prev;
                return [...prev, profile];
            });
        } catch (err) {
            console.error("Failed to fetch reader profile, using fallback", err);
            // Fallback: Add with default avatar and ID as name
            setActiveReaders(prev => {
                if (prev.some(r => r.id === userId)) return prev;
                return [...prev, {
                    id: userId,
                    username: userId,
                    avatar: defaultAvatar
                } as User];
            });
        }
    };

    const handleToggleFriendSelection = (friendId: string) => {
        const newSet = new Set(selectedFriends);
        if (newSet.has(friendId)) {
            newSet.delete(friendId);
        } else {
            newSet.add(friendId);
        }
        setSelectedFriends(newSet);
    };

    const handleSendInvitations = async () => {
        if (selectedFriends.size === 0 || !user || !id || !bookMetadata) return;

        const friendsToInvite = friends.filter(f => selectedFriends.has(f.user_id));

        // Optimistic UI Update: Close modal and show success immediately
        setShowInviteModal(false);
        setSelectedFriends(new Set());
        showToast(`Sent ${friendsToInvite.length} invitations`, 'success');

        // Fire and forget (but log errors)
        Promise.all(friendsToInvite.map(friend =>
            invitationApi.sendInvitation(user.id, friend.user_id, String(id), bookMetadata.title)
        )).then(() => {
        }).catch(error => {
            console.error("Failed to send invitations (background)", error);
            // Optional: Show error toast if really needed, but might be jarring if modal is ensuring closed.
        });
    };

    // Fix: Separate connection logic from listeners to prevent re-connection loops
    useEffect(() => {
        if (!socket || !id || !user) return;

        // Join Room ONLY when ID or Socket changes
        socket.emit('join_book_room', { bookId: id, userId: user.id });

        // Add myself to the list initially
        setActiveReaders([{ id: user.id, username: user.username, avatar: user.avatar } as User]);

        return () => {
            // Leave room on unmount or id change
            socket.emit('leave_book_room', { bookId: id, userId: user.id });
        };
    }, [socket, id, user?.id]); // Minimal dependencies

    // Listeners Effect - Separate from connection logic
    useEffect(() => {
        if (!socket) return;

        const handleReadingMessage = (msg: { sender: string | { username: string; avatar: string }; senderId?: string; content: string; time: string; isFriendsOnly?: boolean; avatar?: string }) => {

            // Handle sender being an object or string
            const senderName = typeof msg.sender === 'object' ? msg.sender.username : msg.sender;
            const senderAvatar = typeof msg.sender === 'object' ? msg.sender.avatar : (msg.avatar || defaultAvatar);

            const newMsg: ChatMessage = {
                id: Date.now(),
                user: senderName,
                text: msg.content,
                isMe: false,
                avatar: senderAvatar || defaultAvatar,
                page: currentSpreadRef.current, // Use Ref here
                isFriendsOnly: msg.isFriendsOnly
            };

            if (senderName === user?.username) return;

            // Filtering Logic: Backend handles delivery only to friends.
            // Client simply respects the received message.
            if (msg.isFriendsOnly) {
                // We do NOT block here anymore because if we received it, the backend authorized it.
            }

            setMessages(prev => [...prev, newMsg]);

            if (!showChat) {
                setUnreadCount(prev => prev + 1);
                if (isPopupEnabled) {
                    setPopupMessage(newMsg);
                    setTimeout(() => { setPopupMessage(null); }, 3000);
                }
            }
        };

        const handleUserJoined = (data: { userId: string, count: number }) => {
            setReaderCount(data.count);
            if (data.userId !== user?.id) {
                fetchReaderDetails(data.userId);
            }
        };

        const handleUserLeft = (data: { userId: string, count: number }) => {
            setReaderCount(data.count);
            setActiveReaders(prev => prev.filter(u => u.id !== data.userId));
        };

        const handleActiveUsers = (userIds: any[]) => { // Use any[] to be safe against number/string mix

            // 1. Update count immediately
            setReaderCount(userIds.length);

            // 2. Filter out duplicates or myself if already added, ensuring all are strings
            const uniqueIds = Array.from(new Set(userIds.map(id => String(id))));


            // 3. Fetch details for everyone
            uniqueIds.forEach(uid => {
                // Ensure compare with string version of user.id
                if (uid && uid !== String(user?.id)) {
                    fetchReaderDetails(uid);
                }
            });
        };

        socket.on('reading_message', handleReadingMessage);
        socket.on('user_joined_book', handleUserJoined);
        socket.on('user_left_book', handleUserLeft);
        socket.on('active_users', handleActiveUsers);

        return () => {
            socket.off('reading_message', handleReadingMessage);
            socket.off('user_joined_book', handleUserJoined);
            socket.off('user_left_book', handleUserLeft);
            socket.off('active_users', handleActiveUsers);
        };
    }, [socket, user?.username, user?.id]); // Removed showChat/messages dependencies to prevent listener re-binding

    // Request active users on mount/connection with a slight delay to ensure join is processed
    useEffect(() => {
        if (socket && id && user?.id) {
            const timer = setTimeout(() => {
                socket.emit('request_active_users', { bookId: id });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [socket, id, user?.id]);
    // Dependencies here just affect closure values for incoming msg handling (like showChat state)


    // Chat Handlers
    const handleSendMessage = () => {
        if (!chatMessage.trim() || !user || !socket) return;

        const content = chatMessage;

        // Optimistic
        const newMessage: ChatMessage = {
            id: Date.now(),
            user: 'You',
            text: content,
            isMe: true,
            avatar: null,
            page: currentSpread,
            isFriendsOnly: isFriendsOnly // Set flag on optimistic message
        };
        setMessages(prev => [...prev, newMessage]);
        setChatMessage('');
        setTimeout(() => { if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight; }, 100);

        // Emit matches backend contract // UPDATED PAYLOAD
        socket.emit('reading_message', {
            conversationId: `book_${id}`, // Room ID
            sender: {
                id: user.id,
                username: user.username,
                avatar: user.avatar
            },
            senderId: user.id,
            content: content,
            isFriendsOnly: isFriendsOnly
        });
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
        if (showChat) {
            setUnreadCount(0);
            setPopupMessage(null);
        }
    }, [showChat]);

    const handleCloseModal = () => {
        setShowInviteModal(false);
        setInviteMode('direct');
    };

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

    const totalSpreads = Math.ceil((pages.length) / 2);

    // Callbacks for BookViewer
    const handleNext = useCallback(() => bookRef.current?.pageFlip().flipNext(), []);
    const handlePrev = useCallback(() => bookRef.current?.pageFlip().flipPrev(), []);

    // Derived state for "+X" others
    const extraCount = Math.max(0, readerCount - activeReaders.length);

    return (
        <div className="min-h-screen w-full bg-[#050505] flex flex-col font-sans text-white overflow-hidden selection:bg-[#d4af37] selection:text-black">

            {/* HEADER */}
            <header className="flex-none h-16 bg-[#050505] border-b border-white/10 px-6 flex items-center justify-between z-[9999] relative">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:border-[#d4af37] transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`w-10 h-10 flex items-center justify-center rounded-full border border-white/10 transition-colors ${isSidebarOpen ? 'bg-[#d4af37] text-black' : 'bg-white/5'}`}><Menu className="w-5 h-5" /></button>
                    <div>
                        <h1 className="text-sm font-bold text-white truncate max-w-xs">{bookMetadata?.title}</h1>
                        <span className="text-xs text-zinc-500">Spread {currentSpread} of {totalSpreads}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* ACTIVE READERS GROUP - Fix pointer events and z-index */}
                    <div
                        className="flex items-center mr-4 cursor-pointer hover:opacity-80 transition-opacity relative z-50 pointer-events-auto"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowReadersList(true);
                        }}
                        title="View all active readers"
                    >
                        {activeReaders.slice(0, 5).map((u, index) => (
                            <div key={u.id || index} style={{ marginLeft: index === 0 ? 0 : '-15px', zIndex: index, position: 'relative' }}>
                                <Avatar className="w-10 h-10 border-[3px] border-[#050505]">
                                    <AvatarImage src={u.avatar} alt={u.username} />
                                    <AvatarFallback className="bg-zinc-800">
                                        <img src={defaultAvatar} alt="Default" className="h-full w-full object-cover" />
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        ))}
                        {/* Fallback to show at least me if list is empty */}
                        {activeReaders.length === 0 && user && (
                            <div style={{ zIndex: 0, position: 'relative' }}>
                                <Avatar className="w-10 h-10 border-[3px] border-[#050505]">
                                    <AvatarImage src={user.avatar} alt={user.username} />
                                    <AvatarFallback className="bg-zinc-800">
                                        <img src={defaultAvatar} alt="Default" className="h-full w-full object-cover" />
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        )}

                        {(activeReaders.length > 3 || extraCount > 0) && (
                            <div style={{ marginLeft: '-15px', zIndex: 10, width: '40px', height: '40px', borderRadius: '999px', border: '3px solid #050505', backgroundColor: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', color: '#a1a1aa', position: 'relative' }}>
                                +{Math.max(activeReaders.length - 3, 0) + extraCount}
                            </div>
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
                                    <Avatar className="w-8 h-8 flex-shrink-0">
                                        <AvatarImage src={popupMessage.avatar || defaultAvatar} />
                                        <AvatarFallback><img src={defaultAvatar} alt="Default" className="h-full w-full object-cover" /></AvatarFallback>
                                    </Avatar>
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

                {/* BOOK VIEWER COMPONENT */}
                <BookViewer
                    pages={pages}
                    isLoading={isLoading}
                    isIngesting={isIngesting}
                    isFetchingBatch={isFetchingBatch}
                    ingestionMessage={ingestionMessage}
                    currentSpread={currentSpread}
                    totalSpreads={totalSpreads}
                    onFlip={onFlip}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    bookRef={bookRef}
                />
            </div>

            {/* CHAT SIDEBAR */}
            {
                showChat && (
                    <aside style={{ width: '350px', backgroundColor: '#0a0a0a', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 50, boxShadow: '-5px 0 20px rgba(0,0,0,0.5)' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontWeight: 'bold', color: '#fff', margin: 0, fontSize: '1.1rem' }}>Live Chat</h3>
                            <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><X className="w-5 h-5 hover:text-white" /></button>
                        </div>
                        <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {messages
                                .filter(msg => isFriendsOnly ? msg.isFriendsOnly : !msg.isFriendsOnly)
                                .length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
                                    {isFriendsOnly ? "No friends-only messages." : "No public messages."}
                                </div>
                            ) : (
                                messages
                                    .filter(msg => isFriendsOnly ? msg.isFriendsOnly : !msg.isFriendsOnly)
                                    .map((msg) => (
                                        <div key={msg.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexDirection: msg.isMe ? 'row-reverse' : 'row', alignSelf: msg.isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                            {!msg.isMe && (
                                                <Avatar className="w-10 h-10 border-2 border-[#050505]" style={{ marginRight: '10px' }}>
                                                    <AvatarImage src={msg.avatar || defaultAvatar} />
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
                                    ))
                            )}
                        </div>

                        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#0a0a0a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', color: '#666', fontSize: '0.8rem' }}>
                                <button onClick={() => setIsPopupEnabled(!isPopupEnabled)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: isPopupEnabled ? '#d4af37' : '#666' }}>
                                    {isPopupEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                                    <span>Popups {isPopupEnabled ? 'On' : 'Off'}</span>
                                </button>

                                <button
                                    onClick={() => setIsFriendsOnly(!isFriendsOnly)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: isFriendsOnly ? '#d4af37' : '#666',
                                        fontWeight: isFriendsOnly ? 'bold' : 'normal'
                                    }}
                                >
                                    <Users className="w-3 h-3" />
                                    <span>{isFriendsOnly ? 'Friends Only' : 'Everyone'}</span>
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#18181b', padding: '8px', borderRadius: '24px', border: '1px solid #333' }}>
                                <input style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.9rem', paddingLeft: '8px' }} placeholder={isFriendsOnly ? "Message friends..." : "Type a message..."} value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
                                <button onClick={handleSendMessage} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#d4af37', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#000', transition: 'transform 0.1s' }}><Send className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </aside>
                )
            }

            {/* INVITE MODAL - Updated Multi-select UI */}
            {
                showInviteModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <div style={{ backgroundColor: '#0a0a0a', width: '100%', maxWidth: '450px', borderRadius: '16px', border: '1px solid rgba(212, 175, 55, 0.3)', boxShadow: '0 0 40px rgba(212, 175, 55, 0.1)', padding: '30px', position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', margin: 0 }}>Invite Friends</h3>
                                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}><X className="w-6 h-6 hover:text-white transition-colors" /></button>
                            </div>

                            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>Select friends to invite to this reading session.</p>

                            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                                {(() => {
                                    // Filter friends who are NOT already in the activeReaders list
                                    const availableFriends = friends.filter(friend =>
                                        !activeReaders.some(reader => String(reader.id) === String(friend.user_id))
                                    );

                                    if (friends.length === 0) {
                                        return <div className="text-zinc-500 text-center py-8">No friends found. Add friends from your profile!</div>;
                                    }

                                    if (availableFriends.length === 0) {
                                        return <div className="text-zinc-500 text-center py-8">All your friends are already here! 🎉</div>;
                                    }

                                    return availableFriends.map(friend => {
                                        const isSelected = selectedFriends.has(friend.user_id);
                                        return (
                                            <div
                                                key={friend.user_id}
                                                onClick={() => handleToggleFriendSelection(friend.user_id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px',
                                                    backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.1)' : '#111',
                                                    border: isSelected ? '1px solid #d4af37' : '1px solid #222',
                                                    cursor: 'pointer', transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <Avatar className="w-10 h-10 border border-white/10">
                                                        <AvatarImage src={friend.avatar || defaultAvatar} />
                                                        <AvatarFallback>{friend.username[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p style={{ color: isSelected ? '#d4af37' : '#fff', fontWeight: 'bold', fontSize: '0.9rem', margin: 0 }}>{friend.username}</p>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    width: '20px', height: '20px', borderRadius: '4px',
                                                    border: isSelected ? 'none' : '2px solid #444',
                                                    backgroundColor: isSelected ? '#d4af37' : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    {isSelected && <Check className="w-3 h-3 text-black" />}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button onClick={handleCloseModal} style={{ padding: '12px 20px', backgroundColor: 'transparent', color: '#fff', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' }}>Cancel</button>
                                <button
                                    onClick={handleSendInvitations}
                                    disabled={selectedFriends.size === 0}
                                    style={{ flex: 1, backgroundColor: selectedFriends.size > 0 ? '#d4af37' : '#333', color: selectedFriends.size > 0 ? '#000' : '#888', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: selectedFriends.size > 0 ? 'pointer' : 'not-allowed', fontSize: '1rem', transition: 'background 0.2s' }}
                                >
                                    Send Invitations {selectedFriends.size > 0 && `(${selectedFriends.size})`}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* READERS LIST MODAL */}
            {showReadersList && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowReadersList(false)}>
                    <div style={{ backgroundColor: '#0f0f0f', width: '100%', maxWidth: '400px', maxHeight: '80vh', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#18181b' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users className="w-5 h-5 text-[#d4af37]" />
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', margin: 0 }}>Active Readers ({readerCount})</h3>
                            </div>
                            <button onClick={() => setShowReadersList(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X className="w-5 h-5 hover:text-white" /></button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {activeReaders.map(reader => (
                                <div key={reader.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Avatar className="w-10 h-10 border border-white/10">
                                        <AvatarImage src={reader.avatar || defaultAvatar} />
                                        <AvatarFallback className="bg-[#27272a]">{reader.username[0]}</AvatarFallback>
                                    </Avatar>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ color: '#fff', fontWeight: 'bold', margin: 0, fontSize: '0.95rem' }}>{reader.username}</p>
                                        <p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>Reading now</p>
                                    </div>
                                    {reader.id === user?.id && (
                                        <span style={{ fontSize: '0.7rem', backgroundColor: '#d4af37', color: '#000', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>YOU</span>
                                    )}
                                </div>
                            ))}

                            {/* Ghost rows removed as per user request */}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookReaderPage;