import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Download } from 'lucide-react';
import Header from '../components/Header';
import { booksApi, type Book as BookType } from '../services/api';

const HomePage = () => {
    const navigate = useNavigate();
    const [searchValue, setSearchValue] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [categories, setCategories] = useState<string[]>([]);
    const [trendingBooks, setTrendingBooks] = useState<BookType[]>([]);
    const [categoryBooks, setCategoryBooks] = useState<BookType[]>([]);

    const categoryScrollRef = useRef<HTMLDivElement>(null);
    const isScrolling = useRef(false);

    // --- DATA ---
    // Safely access category or fallback
    const selectedCategory = categories.length > 0 ? categories[activeIndex] : '';

    // --- FETCH DATA ---
    useEffect(() => {
        // 1. Fetch Categories
        const fetchCategories = async () => {
            try {
                const cats = await booksApi.getCategories();
                if (cats && Array.isArray(cats) && cats.length > 0) {
                    setCategories(cats);
                    // Center the wheel if possible, or start at 0
                    setActiveIndex(Math.floor(cats.length / 2));
                }
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };

        // 2. Fetch Trending
        const fetchTrending = async () => {
            try {
                const data = await booksApi.getTrending();
                setTrendingBooks(data || []);
            } catch (error) {
                console.error("Failed to fetch trending:", error);
            }
        };

        fetchCategories();
        fetchTrending();
    }, []);

    // 3. Fetch Category Books
    useEffect(() => {
        if (!selectedCategory) return;

        const fetchCategoryBooks = async () => {
            try {
                const data = await booksApi.getBooks(1, selectedCategory);
                setCategoryBooks(data || []);
            } catch (error) {
                console.error(`Failed to fetch books for ${selectedCategory}:`, error);
                setCategoryBooks([]);
            }
        };
        fetchCategoryBooks();
    }, [selectedCategory]);

    // --- SCROLL LOGIC ---
    useEffect(() => {
        const element = categoryScrollRef.current;
        if (!element || categories.length === 0) return;

        const handleWheel = (e: WheelEvent) => {
            if (element.contains(e.target as Node)) {
                e.preventDefault();
                if (isScrolling.current) return;
                isScrolling.current = true;

                const len = categories.length;
                if (len === 0) return;

                if (e.deltaY > 0) {
                    setActiveIndex((prev) => (prev + 1) % len);
                } else {
                    setActiveIndex((prev) => (prev - 1 + len) % len);
                }

                setTimeout(() => {
                    isScrolling.current = false;
                }, 300);
            }
        };
        element.addEventListener('wheel', handleWheel, { passive: false });
        return () => element.removeEventListener('wheel', handleWheel);
    }, [categories]); // Re-bind if categories change

    const handleSearchSubmit = () => {
        if (searchValue.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchValue)}`);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#050505] text-white font-sans selection:bg-[#d4af37] selection:text-black relative overflow-x-hidden">

            {/* Hide Scrollbar CSS */}
            <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-40 blur-sm scale-105"
                    style={{ backgroundImage: 'url(/src/assets/lp.jpg)' }}
                ></div>
            </div>

            <Header
                showSearch
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                onSearchSubmit={handleSearchSubmit}
            />

            <div
                className="relative z-10 px-6 lg:px-12 pb-20"
                style={{ paddingTop: '150px' }}
            >

                {/* ================= TRENDING SECTION ================= */}
                <section
                    className="w-full max-w-[1800px] mx-auto"
                    style={{ marginTop: '-7rem', marginBottom: '1rem', marginRight: '2rem', marginLeft: '2rem' }}
                >
                    {/* Header Title */}
                    <div
                        className="flex justify-between items-end relative z-10 w-full"
                        style={{
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            paddingBottom: '1rem',
                            marginBottom: '1rem'
                        }}
                    >
                        <div>
                            <h3 className="text-[#d4af37] font-medium text-xs tracking-[0.2em] uppercase mb-3 flex items-center gap-2">
                                <Flame className="w-4 h-4" /> Hot Right Now
                            </h3>
                            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                                Trending <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500">This Week</span>
                            </h1>
                        </div>
                    </div>

                    {/* Trending Carousel */}
                    <div className="w-full overflow-hidden">
                        {/* FIX: Increased padding-bottom to pb-20 to allow full hover/shadow visibility */}
                        <div
                            className="flex gap-6 overflow-x-auto pb-20 snap-x hide-scrollbar"
                            style={{ scrollBehavior: 'smooth', minHeight: '550px' }}
                        >
                            {trendingBooks.length > 0 ? trendingBooks.map((book, index) => (
                                <div key={`trending-${book.id}-${index}`} className="w-[18rem] shrink-0 snap-start">
                                    <BookCard book={book} />
                                </div>
                            )) : (
                                <div className="text-zinc-500 py-10 w-full text-center">Loading trending books...</div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ================= CATEGORIES SECTION ================= */}
                <main
                    className="h-[calc(100vh-140px)] w-full max-w-[1800px] mx-auto flex flex-col lg:flex-row relative"
                    style={{ marginBottom: '5rem' }}
                >

                    {/* LEFT SIDE (Wheel) */}
                    <div
                        ref={categoryScrollRef}
                        className="w-full h-full flex flex-col justify-start items-start pl-4 lg:pl-10 relative select-none cursor-ns-resize z-30"
                        style={{ paddingTop: '3rem', marginLeft: '3rem', width: '20rem' }}
                    >

                        {/* Moved instructions down */}
                        <p className="absolute top-0 left-6 lg:left-12 text-[10px] text-zinc-500 uppercase tracking-[0.3em] animate-pulse">
                            Hover here & Scroll
                        </p>

                        <div className="flex flex-col gap-4 lg:gap-6">
                            {categories.length > 0 ? [-2, -1, 0, 1, 2].map((offset) => {
                                const index = (activeIndex + offset + categories.length) % categories.length;
                                const catName = categories[index];
                                const isActive = offset === 0;
                                const isNear = Math.abs(offset) === 1;

                                return (
                                    <h2
                                        key={`${catName}-${offset}`}
                                        onClick={() => setActiveIndex(index)}
                                        className={`
                                    transition-all duration-500 ease-out font-bold tracking-tight leading-none cursor-pointer origin-left whitespace-nowrap
                                    ${isActive
                                                ? 'text-6xl lg:text-8xl text-white translate-x-4 scale-100 opacity-100 z-10'
                                                : isNear
                                                    ? 'text-5xl lg:text-6xl text-zinc-500 translate-x-2 scale-90 opacity-60 blur-0'
                                                    : 'text-4xl lg:text-5xl text-zinc-600 translate-x-0 scale-75 opacity-30 blur-[1px]'
                                            }
                                `}
                                    >
                                        {catName}
                                    </h2>
                                );
                            }) : (
                                <div className="text-zinc-500 text-2xl">Loading Categories...</div>
                            )}
                        </div>

                    </div>

                    {/* RIGHT SIDE (Category Carousel) */}
                    <div
                        className="h-full flex flex-col justify-center px-4 relative z-20"
                        style={{ width: '55rem', marginRight: '40px' }}
                    >
                        {/* Category Header */}
                        <div
                            className="flex justify-between items-end relative z-10"
                            style={{
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                paddingBottom: '1rem',
                            }}
                        >
                            <div>
                                <h3 className="text-[#d4af37] font-medium text-xs tracking-[0.2em] uppercase mb-3">Editors' Choice</h3>
                                <h1 className="text-3xl lg:text-5xl font-bold text-white">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400">
                                        {selectedCategory}
                                    </span>
                                </h1>
                            </div>
                        </div>

                        {/* Category Carousel */}
                        <div className="w-full overflow-hidden">
                            {/* FIX: Increased padding-bottom to pb-20 and min-height to 550px */}
                            <div
                                className="flex gap-6 overflow-x-auto pb-20 snap-x hide-scrollbar"
                                style={{ minHeight: '550px', justifyContent: 'start' }}
                            >
                                {categoryBooks.length > 0 ? categoryBooks.map((book) => (
                                    <div key={book.id} className="w-[18rem] shrink-0 snap-start" style={{ justifyContent: 'start' }}>
                                        <BookCard book={book} />
                                    </div>
                                )) : (
                                    <div className="w-full h-[450px] flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-3xl bg-white/[0.02]">
                                        <p className="text-zinc-500 text-lg font-light mb-4">
                                            No books found for <span className="text-[#d4af37] font-medium">{selectedCategory}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
};

// Book Card
const BookCard = ({ book }: { book: Book }) => {
    const navigate = useNavigate();
    const slugify = (text: string | number) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
    };

    const coverImage = book.formats?.['image/jpeg'] || "https://placehold.co/300x450?text=No+Cover";
    const authorName = book.authors?.map(a => a.name).join(', ') || 'Unknown Author';

    return (
        <div
            onClick={() => navigate(`/books/${book.id}/${slugify(book.title)}`, { state: { book } })}
            className="group relative bg-[#111] border border-white/5 rounded-2xl overflow-hidden hover:border-[#d4af37]/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,1)] flex flex-col cursor-pointer h-[28rem] w-full"
        >
            {/* Cover Image - flex-1 fills remaining space */}
            <div className="flex-1 overflow-hidden bg-[#1a1a1a] min-h-0">
                <img
                    src={coverImage}
                    alt={book.title}
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105 group-hover:brightness-110"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/300x450/1a1a1a/d4af37?text=No+Cover";
                    }}
                />
            </div>
            {/* Info Section - fixed height */}
            <div className="p-4 flex flex-col justify-between bg-[#111] shrink-0" style={{ height: '8rem' }}>
                <div style={{ margin: '0.5rem' }}>
                    <h3 className="text-white font-bold text-base leading-tight line-clamp-1 mb-1 group-hover:text-[#d4af37] transition-colors">
                        {book.title}
                    </h3>
                    <p className="text-zinc-500 text-xs line-clamp-1">{authorName}</p>
                </div>
                <div className="flex items-center justify-between mt-auto" style={{ margin: '0.5rem' }}>
                    <button className="bg-gradient-to-r from-[#bb750d] via-[#d45b0a] to-[#c8d50e] text-black font-medium rounded-sm px-3 py-1 text-sm">
                        Details
                    </button>
                    <span className="text-white font-bold text-sm flex items-center gap-1">
                        <Download className="w-4 h-4 text-[#d4af37]" />
                        {book.download_count}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default HomePage;