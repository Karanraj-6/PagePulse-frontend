import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Download, Languages, BookOpen, ChevronRight } from 'lucide-react';

// FIX: Import the background image so Vite/Webpack processes it correctly
import bgImage from '../assets/lp.jpg';

// --- GLASSY RESULTS BOARD COMPONENT ---
interface SearchResultsBoardProps {
  query?: string;
  category?: string;
  results: any[]; // Using any[] temporarily or Book[] if imports allow, verifying imports below
  children?: React.ReactNode;
  style?: React.CSSProperties; // Added to fix style prop error seen in logs
}

const SearchResultsBoard = ({ query, category, results, children, style }: SearchResultsBoardProps) => {
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
          {results.length} {results.length === 1 ? 'result' : 'results'} found
        </span>
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// --- DUMMY DATA ---
import { booksApi, type Book } from '../services/api';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';

  const [searchValue, setSearchValue] = useState(query || category);
  const [results, setResults] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);



  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        // Prepare params
        // API signature: getBooks(page, category, search)
        // If query exists, treat as search. If category exists (and no query), filter by category.
        const search = query || undefined;
        const cat = category || undefined;

        console.log('[SearchPage] Fetching with:', { page: 1, category: cat, search });
        const data = await booksApi.getBooks(1, cat, search);
        console.log('[SearchPage] API Response:', data);
        setResults(data || []);
      } catch (error) {
        console.error("[SearchPage] Search failed:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query, category]);

  const slugify = (text: string | number) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')        // Replace spaces with -
      .replace(/[^\w-]+/g, '')     // Remove all non-word chars
      .replace(/--+/g, '-');       // Replace multiple - with single -
  };

  const handleSearchSubmit = () => {
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue)}`);
    }
  };

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
        className="w-full relative z-10"
        style={{
          maxWidth: '90rem',
          margin: '0 auto',
          marginTop: '-6rem',
          paddingTop: '10rem',
          paddingBottom: '5rem',
          paddingLeft: '2rem',
          paddingRight: '2rem',
          backdropFilter: 'blur(100px)',
        }}
      >

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center" style={{ marginTop: '8rem' }}>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4af37]" />
          </div>
        ) : results.length === 0 ? (
          <div
            className="text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02] backdrop-blur-sm"
            style={{ marginTop: '8rem', padding: '6rem' }}
          >
            <p className="text-zinc-400 text-xl">No books found matching your criteria.</p>
          </div>
        ) : (

          /* GLASSY BOARD */
          <SearchResultsBoard query={query} category={category} results={results} style={{ opacity: '100' }}>
            <div className="flex flex-col" style={{ gap: '2rem' }}>
              {results.map((book) => (
                <div
                  key={book.id}
                  // --- NAVIGATION TRIGGER ---
                  // This ensures clicking the card redirects to /books/:id/:slug
                  onClick={() => navigate(`/books/${book.id}/${slugify(book.title)}`)}
                  className="group flex flex-col md:flex-row items-center bg-black/40 border border-white/5 rounded-3xl cursor-pointer hover:border-[#d4af37]/30 hover:bg-white/[0.05] transition-all duration-300 relative overflow-hidden shadow-lg"
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
                      {/* Description not in schema, using subjects as fallback or removing if not in Book interface?
                          Schema says 'subjects', 'bookshelves', but NO 'description'.
                          Users schema: "See schema above".
                          Schema for `books`: id, title, authors, formats, subjects, bookshelves, languages, copyright, media_type, download_count.
                          NO description.
                          So I should handle lack of description.
                      */}
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

                      {/* Language - Hardcoded to EN if missing as mostly Gutendex is EN or we lack field */}
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Languages className="w-5 h-5" />
                        <span className="text-xl font-bold text-white uppercase">EN</span>
                        <span className="text-xs uppercase tracking-wide font-medium">Language</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SearchResultsBoard>
        )}
      </div>
    </div>
  );
};

export default SearchPage;