import { useState, useEffect } from 'react';
import { booksApi, type Book, authApi } from '../services/api';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, BookOpen, Heart, Share2, Download, Languages, FileText } from 'lucide-react';
import Header from '../components/Header';
import TiltedCard from '../components/TiltedCard';
import bgImage from '@/assets/lp.jpg';

const BookDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    // Removed unused user
    useAuth();
    const { showToast } = useToast();

    // Get book from navigation state (passed from SearchPage)
    const bookFromState = (location.state as { book?: Book })?.book;

    const [book, setBook] = useState<Book | null>(bookFromState || null);
    const [isLoading, setIsLoading] = useState(!bookFromState); // Skip loading if we have state
    const [isFavorite, setIsFavorite] = useState(false);
    const [isBackHovered, setIsBackHovered] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
    };

    const handleSearchSubmit = (val: string) => {
        const term = val || searchValue; // Use passed value or state
        if (term.trim()) {
            navigate(`/search?q=${encodeURIComponent(term)}`);
        }
    };

    useEffect(() => {
        // If we already have book from state, skip API call
        if (bookFromState) {
            setBook(bookFromState);
            setIsLoading(false);
            return;
        }

        const fetchBook = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const data = await booksApi.getById(id);
                setBook(data);
            } catch (err) {
                console.error("Failed to fetch book:", err);
                setBook(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBook();
    }, [id, bookFromState]);

    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (book) {
                try {
                    const favIds = await authApi.getFavorites();
                    // Convert everything to string for safe comparison
                    const isFav = favIds.some(id => String(id) === String(book.id || book._id));
                    setIsFavorite(isFav);
                } catch (e) {
                    console.error("Failed to check favorite status", e);
                }
            }
        };
        checkFavoriteStatus();
    }, [book]);

    const handleFavoriteClick = async () => {
        if (!book) return;

        // Optimistic update
        const newStatus = !isFavorite;
        setIsFavorite(newStatus);

        const bookId = book.id || book._id;

        try {
            if (newStatus) {
                await authApi.addFavorite(bookId!); // ! because we checked book exists
            } else {
                await authApi.removeFavorite(bookId!);
            }
        } catch (error: any) {
            console.error("Failed to update favorite status", error);
            // If error is 404 on remove, it means it's already removed, so don't revert.
            // But if it's 404 on add, or any other error, revert.
            if (!(!newStatus && error.response?.status === 404)) {
                setIsFavorite(!newStatus); // Revert
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4af37]" />
            </div>
        );
    }

    if (!book) {
        return (
            <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center text-white">
                <p className="text-zinc-400 mb-4 text-xl">Book not found (ID: {id})</p>
                <button onClick={() => navigate('/home')} className="text-[#d4af37] hover:underline">Go back home</button>
            </div>
        );
    }

    const coverImage = book.formats?.['image/jpeg'];
    // Prefer 'authors' (new standard)
    const authorName = book.authors?.map(a => a.name).join(', ') || 'Unknown Author';
    const category = book.subjects?.[0] || 'General';
    // Schema doesn't have description, using subjects as fallback
    const description = book.summaries?.join(', ') || "No description available.";
    const media_type = book.media_type;
    return (
        <div className="min-h-screen w-full bg-[#050505] text-white font-sans selection:bg-[#d4af37] selection:text-black relative flex flex-col items-center">

            {/* Background Layer */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-100 blur-sm scale-105"
                    style={{ backgroundImage: `url(${bgImage})` }}
                ></div>
            </div>


            <Header
                showSearch={true}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                onSearchSubmit={() => handleSearchSubmit(searchValue)}
            />

            {/* Main Container */}
            <div
                className="w-full max-w-6xl px-6 relative z-10 pb-20"
                style={{ paddingTop: '8rem', marginTop: '-5rem', marginBottom: '3rem' }}
            >
                {/* Back Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                    <button
                        onClick={() => navigate(-1)}
                        onMouseEnter={() => setIsBackHovered(true)}
                        onMouseLeave={() => setIsBackHovered(false)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            color: isBackHovered ? '#d4af37' : '#a1a1aa', // zinc-400 to gold
                            transition: 'color 300ms',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <div
                            style={{
                                width: '2.5rem',
                                height: '2.5rem',
                                borderRadius: '9999px',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: isBackHovered ? '#d4af37' : 'rgba(255, 255, 255, 0.1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'border-color 300ms'
                            }}
                        >
                            <ArrowLeft style={{ width: '1.25rem', height: '1.25rem' }} />
                        </div>
                        <span
                            style={{
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em'
                            }}
                        >
                            Back to Search
                        </span>
                    </button>
                </div>

                {/* GLASSY DETAIL CARD */}
                <div
                    className="w-full bg-[#0a0a0a]/60 backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden"
                    style={{ borderRadius: '2.5rem', padding: '3rem' }}
                >
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                    <div className="flex flex-col lg:flex-row gap-12 items-start">

                        {/* LEFT: Tilted Book Cover */}
                        <div className="flex flex-col items-center shrink-0 mx-auto lg:mx-0">
                            <TiltedCard
                                imageSrc={coverImage || "https://placehold.co/300x450/111/444?text=No+Cover"}
                                altText={book.title}
                                captionText={book.title}
                                containerHeight="450px"
                                containerWidth="300px"
                                imageHeight="450px"
                                imageWidth="300px"
                                rotateAmplitude={12}
                                scaleOnHover={1.05}
                                showMobileWarning={false}
                                showTooltip={false}
                                displayOverlayContent={false}

                            />
                        </div>

                        {/* RIGHT: Content */}
                        <div className="flex-1 flex flex-col w-full">

                            {/* Top Tags */}
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <span className="px-4 py-1.5 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37] text-xs font-bold uppercase tracking-widest">
                                    {category}
                                </span>
                            </div>

                            {/* Title & Author */}
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                                {book.title}
                            </h1>
                            <p className="text-xl text-zinc-400 font-light mb-8">
                                by <span className="text-white font-medium border-b border-[#d4af37]/50">{authorName}</span>
                            </p>

                            {/* Stats Row */}
                            <div className="flex flex-wrap items-center gap-8 mb-10 py-6 border-y border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-white/5"><Download className="w-5 h-5 text-[#d4af37]" /></div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-lg">{(book.download_count ?? 0).toLocaleString()}</span>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Downloads</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-white/5"><Languages className="w-5 h-5 text-[#d4af37]" /></div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-lg uppercase">{book.languages?.[0] || 'EN'}</span>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Language</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-white/5"><FileText className="w-5 h-5 text-[#d4af37]" /></div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-lg">{media_type}</span>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Media Type</span>
                                    </div>
                                </div>
                            </div>

                            {/* Synopsis */}
                            <div className="mb-10">
                                <h3 className="text-lg font-bold text-white mb-3">Synopsis</h3>
                                <p className="text-lg text-zinc-400 leading-relaxed font-light line-clamp-[8]">
                                    {description}
                                </p>
                            </div>

                            {/* FIXED: Action Buttons using strict inline CSS for layout */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '1rem',
                                    marginTop: 'auto',
                                    width: '100%',
                                    alignItems: 'center'
                                }}
                            >
                                {/* Start Reading Button */}
                                <button
                                    onClick={() => navigate(`/books/${book.id}/${slugify(book.title)}/read`)}
                                    className="bg-[#d4af37] hover:bg-[#b8960c] text-black font-bold text-lg hover:shadow-[0_0_25px_-5px_#d4af37] transition-all group"
                                    style={{
                                        flex: '1 1 auto', // Grow to fill space
                                        minWidth: '200px',
                                        height: '4rem',
                                        borderRadius: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.75rem',
                                        paddingLeft: '1.5rem',
                                        paddingRight: '1.5rem'
                                    }}

                                >
                                    <BookOpen className="w-5 h-5" />
                                    Start Reading
                                </button>

                                {/* Icon Buttons Container */}
                                <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
                                    <button
                                        onClick={handleFavoriteClick}
                                        className={`transition-all duration-300 ${isFavorite ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-white/5 border-white/10 hover:border-[#d4af37] hover:text-[#d4af37] text-white'}`}
                                        style={{
                                            height: '4rem',
                                            width: '4rem',
                                            borderRadius: '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderWidth: '2px',
                                            borderStyle: 'solid'
                                        }}
                                    >
                                        <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                                    </button>

                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            showToast("Link copied to clipboard", "success");
                                        }}
                                        className="bg-white/5 hover:border-[#d4af37] hover:text-[#d4af37] text-white transition-all"
                                        style={{
                                            height: '4rem',
                                            width: '4rem',
                                            borderRadius: '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                            borderColor: 'rgba(255, 255, 255, 0.1)'
                                        }}
                                    >
                                        <Share2 className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookDetailPage;