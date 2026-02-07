import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Download, Languages, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// FIX: Import the background image so Vite/Webpack processes it correctly
import bgImage from '@/assets/lp.jpg';

// --- GLASSY RESULTS BOARD COMPONENT ---
interface SearchResultsBoardProps {
  query?: string;
  category?: string;
  totalResults: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const SearchResultsBoard = ({ query, category, totalResults, children, style }: SearchResultsBoardProps) => {
  return (
    <div
      className="w-full bg-[#0a0a0a]/60 backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden"
      style={{
        borderRadius: '3rem',
        paddingTop: '3rem',
        paddingBottom: '3rem',
        paddingLeft: '6rem',
        paddingRight: '6rem',
        ...style
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      <div
        className="flex flex-col md:flex-row md:items-baseline gap-4 border-b border-white/10"
        style={{ marginBottom: '3rem', paddingBottom: '2rem' }}
      >
        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
          {query ? (
            <>Results for <span className="text-[#d4af37]">"{query}"</span></>
          ) : (
            category ? `${category} Books` : 'All Books'
          )}
        </h1>
        <span className="text-zinc-500 text-2xl font-medium">
          {totalResults} {totalResults === 1 ? 'result' : 'results'} found
        </span>
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

import { booksApi, type Book } from '../services/api';

const BOOKS_PER_BATCH = 5;

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';

  const [searchValue, setSearchValue] = useState(query || category);
  const [allResults, setAllResults] = useState<Book[]>([]); // All fetched results (max 20)
  const [displayedResults, setDisplayedResults] = useState<Book[]>([]); // Currently displayed (lazy loaded)
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const bookCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    const controller = new AbortController();

    const fetchResults = async () => {
      setIsLoading(true);
      setDisplayedResults([]);
      setAllResults([]);

      try {
        const search = query || undefined;
        const cat = category || undefined;

        const data = await booksApi.getBooks(1, cat, search);
        const results = data || [];
        setAllResults(results);
        // Initially show first 5 books
        setDisplayedResults(results.slice(0, BOOKS_PER_BATCH));
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error("Search failed:", error);
          setAllResults([]);
          setDisplayedResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchResults, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, category]);

  // --- LOAD MORE BOOKS (Infinite Scroll) ---
  const loadMoreBooks = useCallback(() => {
    if (isLoadingMore || displayedResults.length >= allResults.length) return;

    setIsLoadingMore(true);

    // Simulate small delay for smooth UX
    setTimeout(() => {
      const currentCount = displayedResults.length;
      const nextBatch = allResults.slice(currentCount, currentCount + BOOKS_PER_BATCH);
      setDisplayedResults(prev => [...prev, ...nextBatch]);
      setIsLoadingMore(false);
    }, 300);
  }, [allResults, displayedResults.length, isLoadingMore]);

  // --- INTERSECTION OBSERVER FOR INFINITE SCROLL ---
  useEffect(() => {
    if (!loadMoreTriggerRef.current || allResults.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedResults.length < allResults.length) {
          loadMoreBooks();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(loadMoreTriggerRef.current);

    return () => observer.disconnect();
  }, [loadMoreBooks, allResults.length, displayedResults.length]);

  // --- GSAP PARALLAX SCROLL ANIMATION ---
  useEffect(() => {
    if (displayedResults.length === 0) return;

    // Wait for DOM to update
    const timeout = setTimeout(() => {
      bookCardsRef.current.forEach((card, index) => {
        if (!card) return;

        // Clear any existing animations
        gsap.killTweensOf(card);

        // Initial state - cards start slightly below and transparent
        gsap.set(card, {
          opacity: 0,
          y: 80,
          scale: 0.95
        });

        // Parallax scroll animation
        gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            end: 'top 40%',
            scrub: 1,
            toggleActions: 'play none none reverse'
          }
        })
          .to(card, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power2.out',
            delay: index * 0.05 // Stagger effect
          });

        // Subtle parallax movement on scroll
        gsap.to(card, {
          scrollTrigger: {
            trigger: card,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.5
          },
          y: -20,
          ease: 'none'
        });
      });

      // Refresh ScrollTrigger after animations are set
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timeout);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [displayedResults]);

  const slugify = (text: string | number) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  };

  const handleSearchSubmit = () => {
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue)}`);
    }
  };

  const hasMoreBooks = displayedResults.length < allResults.length;

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
        showSearch
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* MAIN WRAPPER */}
      <div
        ref={containerRef}
        className="w-full relative z-10"
        style={{
          maxWidth: '90rem',
          margin: '0 auto',
          marginTop: '-6rem',
          paddingTop: '10rem',
          paddingBottom: '5rem',
          paddingLeft: '2rem',
          paddingRight: '2rem',
        }}
      >

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center align-center justify-center" style={{ width: '100vw', minHeight: 'calc(100vh - 200px)' }}>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4af37]" />
          </div>
        ) : allResults.length === 0 ? (
          <div
            className="text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02] backdrop-blur-sm"
            style={{ marginTop: '8rem', padding: '6rem' }}
          >
            <p className="text-zinc-400 text-xl">No books found matching your criteria.</p>
          </div>
        ) : (

          /* GLASSY BOARD */
          <SearchResultsBoard query={query} category={category} totalResults={allResults.length} style={{ opacity: '100' }}>
            <div className="flex flex-col" style={{ gap: '2rem' }}>
              {displayedResults.map((book, index) => (
                <div
                  key={book.id}
                  ref={el => { bookCardsRef.current[index] = el; }}
                  onClick={() => {
                    // Track the book click for trending (fire and forget)
                    booksApi.trackBook(book).catch(() => { });
                    navigate(`/books/${book.id}/${slugify(book.title)}`, { state: { book } });
                  }}
                  className="book-card group flex flex-col md:flex-row items-center bg-black/40 border border-white/5 rounded-3xl cursor-pointer hover:border-[#d4af37]/30 hover:bg-white/[0.05] transition-all duration-300 relative overflow-hidden shadow-lg"
                  style={{ gap: '2rem', padding: '1.5rem' }}
                >
                  {/* Hover Glow Effect */}
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Book Cover */}
                  <div
                    className="shrink-0 rounded-xl overflow-hidden shadow-2xl group-hover:shadow-[#d4af37]/20 transition-all bg-zinc-900"
                    style={{ width: '160px', height: '240px' }}
                  >
                    {book.formats?.['image/jpeg'] ? (
                      <img
                        src={book.formats['image/jpeg']}
                        alt={book.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                        <BookOpen className="w-12 h-12" />
                      </div>
                    )}
                  </div>

                  {/* Book Info Section */}
                  <div className="flex-1 flex flex-col justify-center w-full">

                    {/* Category & Arrow */}
                    <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                      <span className="text-xs font-bold text-[#d4af37] uppercase tracking-widest bg-[#d4af37]/10 px-3 py-1 rounded-lg border border-[#d4af37]/20">
                        {book.subjects?.[0] || 'General'}
                      </span>
                      <div className="hidden md:block p-2 rounded-full bg-white/5 group-hover:bg-[#d4af37] group-hover:text-black transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Main Text Content */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 className="font-bold text-3xl text-white mb-2 group-hover:text-[#d4af37] transition-colors leading-tight line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-xl text-zinc-400 font-light mb-4">
                        by <span className="text-white font-medium">
                          {book.authors?.map(a => a.name).join(', ') || 'Unknown Author'}
                        </span>
                      </p>
                      <p className="text-lg text-zinc-500 line-clamp-2 leading-relaxed">
                        {book.subjects?.join(', ') || "No description available."}
                      </p>
                    </div>

                    {/* Stats Row */}
                    <div
                      className="flex items-center border-t border-white/10"
                      style={{ paddingTop: '1.25rem', gap: '2rem' }}
                    >
                      {/* Downloads */}
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Download className="w-5 h-5 text-[#d4af37]" />
                        <span className="text-xl font-bold text-white">{(book.download_count || 0).toLocaleString()}</span>
                        <span className="text-xs uppercase tracking-wide font-medium">Downloads</span>
                      </div>

                      {/* Language */}
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Languages className="w-5 h-5" />
                        <span className="text-xl font-bold text-white uppercase">{book.languages?.[0] || 'EN'}</span>
                        <span className="text-xs uppercase tracking-wide font-medium">Language</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Trigger / Loading Indicator */}
            <div
              ref={loadMoreTriggerRef}
              className="flex justify-center items-center py-8"
            >
              {isLoadingMore ? (
                <div className="flex items-center gap-3 text-zinc-400">
                  <Loader2 className="w-6 h-6 animate-spin text-[#d4af37]" />
                  <span>Loading more books...</span>
                </div>
              ) : hasMoreBooks ? (
                <div className="text-zinc-500 text-sm">
                  Scroll down for more • {displayedResults.length} of {allResults.length} shown
                </div>
              ) : displayedResults.length > 0 ? (
                <div className="text-zinc-600 text-sm">
                  ✓ All {allResults.length} results loaded
                </div>
              ) : null}
            </div>
          </SearchResultsBoard>
        )}
      </div>
    </div>
  );
};

export default SearchPage;