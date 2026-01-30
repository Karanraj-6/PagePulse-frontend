import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ShoppingBag, Flame } from 'lucide-react';
import Header from '../components/Header';
import { mockBooks } from '../services/mockData';

const FEATURED_CATEGORIES = [
    "Romance", "Fantasy", "Self-Help", "Crime",
    "Sci-Fi", "Manga", "Thriller", "History",
    "Business", "Horror", "Mystery", "Biography"
];

const HomePage = () => {
    const navigate = useNavigate();
    const [searchValue, setSearchValue] = useState('');
    const [activeIndex, setActiveIndex] = useState(3);

    const categoryScrollRef = useRef(null);
    const isScrolling = useRef(false);

    // --- DATA ---
    const selectedCategory = FEATURED_CATEGORIES[activeIndex];

    const categoryBooks = mockBooks.filter(
        (b) => b.category === selectedCategory || b.category === 'Trending'
    );

    const trendingBooks = mockBooks.filter(b => b.category === 'Trending' || b.rating > 4.5);

    // --- SCROLL LOGIC ---
    useEffect(() => {
        const element = categoryScrollRef.current;
        if (!element) return;

        const handleWheel = (e) => {
            // Only prevent page scroll if hovering strictly inside the Left Panel
            if (element.contains(e.target)) {
                e.preventDefault();

                if (isScrolling.current) return;
                isScrolling.current = true;

                if (e.deltaY > 0) {
                    setActiveIndex((prev) => (prev + 1) % FEATURED_CATEGORIES.length);
                } else {
                    setActiveIndex((prev) => (prev - 1 + FEATURED_CATEGORIES.length) % FEATURED_CATEGORIES.length);
                }

                setTimeout(() => {
                    isScrolling.current = false;
                }, 300);
            }
        };

        element.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            if (element) element.removeEventListener('wheel', handleWheel);
        };
    }, []);

    const handleSearchSubmit = () => {
        if (searchValue.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchValue)}`);
        }
    };

    const slugify = (text) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
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
                            {trendingBooks.map((book) => (
                                <div key={`trending-${book.id}`} className="min-w-[300px] snap-start">
                                    <BookCard book={book} />
                                </div>
                            ))}
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
                        className="w-full lg:w-[40%] h-full flex flex-col justify-start items-start pl-4 lg:pl-10 relative select-none cursor-ns-resize z-30"
                        style={{ paddingTop: '3rem', marginLeft: '3rem' }}
                    >

                        {/* Moved instructions down */}
                        <p className="absolute top-0 left-6 lg:left-12 text-[10px] text-zinc-500 uppercase tracking-[0.3em] animate-pulse">
                            Hover here & Scroll
                        </p>

                        <div className="flex flex-col gap-4 lg:gap-6">
                            {[-2, -1, 0, 1, 2].map((offset) => {
                                const index = (activeIndex + offset + FEATURED_CATEGORIES.length) % FEATURED_CATEGORIES.length;
                                const catName = FEATURED_CATEGORIES[index];
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
                            })}
                        </div>

                    </div>

                    {/* RIGHT SIDE (Category Carousel) */}
                    <div
                        className="w-full lg:w-[60%] h-full flex flex-col justify-center px-4 relative z-20"
                        style={{ marginRight: '40px' }}
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
                                style={{ minHeight: '550px' }}
                            >
                                {categoryBooks.length > 0 ? categoryBooks.map((book) => (
                                    <div key={book.id} className="min-w-[300px] snap-start">
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
const BookCard = ({ book }) => {
    const navigate = useNavigate();
    const slugify = (text) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
    };

    return (
        <div
            onClick={() => navigate(`/books/${book.id}/${slugify(book.title)}`)}
            className="group relative h-[450px] w-full bg-[#111]/90 border border-white/5 rounded-2xl overflow-hidden hover:border-[#d4af37]/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,1)] flex flex-col backdrop-blur-sm cursor-pointer">
            <div className="relative flex-1 overflow-hidden">
                <img
                    src={book.cover}
                    alt={book.title}
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105 group-hover:brightness-110"
                />
                <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-full">
                    -15%
                </div>
            </div>
            <div className="p-5 h-[140px] flex flex-col justify-between bg-transparent">
                <div>
                    <h3 className="text-white font-bold text-lg leading-tight line-clamp-1 mb-1 group-hover:text-[#d4af37] transition-colors">
                        {book.title}
                    </h3>
                    <p className="text-zinc-500 text-xs">{book.author}</p>
                </div>
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-white font-bold text-lg">$14.99</span>
                    <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#d4af37] hover:text-black flex items-center justify-center transition-all duration-300 transform group-hover:rotate-12">
                        <ShoppingBag className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HomePage;