import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Clock, BookOpen, Heart, Share2, Download, Languages, ChevronRight, Headphones } from 'lucide-react';
import Header from '../components/Header';
import TiltedCard from '../components/TiltedCard'; 
import bgImage from '../assets/lp.jpg';

// --- SHARED DUMMY DATA ---
const LOCAL_MOCK_DATA = [
    {
      "id": 84,
      "title": "Frankenstein; Or, The Modern Prometheus",
      "authors": [{ "name": "Shelley, Mary Wollstonecraft", "birth_year": 1797, "death_year": 1851 }],
      "summaries": ["\"Frankenstein; Or, The Modern Prometheus\" by Mary Wollstonecraft Shelley is a Gothic novel published in 1818. It tells the story of Victor Frankenstein, a young scientist who creates a living creature from assembled body parts in an unorthodox experiment. When the creature awakens, Victor flees in horror, abandoning his creation. The conscious being must navigate a world that fears him, learning language and seeking connection, only to face repeated rejection. Embittered and alone, the creature confronts his creator with a desperate request that will set both on a dark path of vengeance and tragedy."],
      "bookshelves": ["Gothic Fiction", "Movie Books"],
      "languages": ["en"],
      "media_type": "Text",
      "formats": { "image/jpeg": "https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg" },
      "download_count": 171806
    },
    {
      "id": 41445,
      "title": "Frankenstein; Or, The Modern Prometheus",
      "authors": [{ "name": "Shelley, Mary Wollstonecraft", "birth_year": 1797, "death_year": 1851 }],
      "summaries": ["A novel written in the early 19th century revolving around Victor Frankenstein..."],
      "bookshelves": ["Precursors of Science Fiction"],
      "languages": ["en"],
      "media_type": "Text",
      "formats": { "image/jpeg": "https://www.gutenberg.org/cache/epub/41445/pg41445.cover.medium.jpg" },
      "download_count": 19327
    }
];

const BookDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
    const [isBackHovered, setIsBackHovered] = useState(false);
  const formatAuthor = (name) => {
    if (!name) return 'Unknown Author';
    return name.includes(',') ? name.split(',').reverse().join(' ').trim() : name;
  };

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const foundBook = LOCAL_MOCK_DATA.find((b) => String(b.id) === String(id));
      setBook(foundBook || null);
      setIsLoading(false);
    }, 300);
  }, [id]);

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

  const coverImage = book.formats && book.formats['image/jpeg'];
  const authorName = book.authors && book.authors.length > 0 ? formatAuthor(book.authors[0].name) : 'Unknown Author';
  const category = book.bookshelves && book.bookshelves.length > 0 ? book.bookshelves[0].replace('Category: ', '') : 'General';
  const description = book.summaries && book.summaries.length > 0 ? book.summaries[0] : "No description available.";

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white font-sans selection:bg-[#d4af37] selection:text-black relative flex flex-col items-center">
      
      {/* Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div 
            className="absolute inset-0 bg-cover bg-center opacity-100 blur-sm scale-105"
            style={{ backgroundImage: `url(${bgImage})` }}
         ></div>
      </div>

      <Header showSearch={true} searchValue="" onSearchChange={() => {}} onSearchSubmit={() => {}} />

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
                        {book.media_type === 'Sound' && (
                            <span className="px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <Headphones className="w-3 h-3" /> Audio
                            </span>
                        )}
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
                                <span className="text-white font-bold text-lg">{book.download_count.toLocaleString()}</span>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Downloads</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-white/5"><Languages className="w-5 h-5 text-[#d4af37]" /></div>
                            <div className="flex flex-col">
                                <span className="text-white font-bold text-lg uppercase">{book.languages ? book.languages[0] : 'EN'}</span>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Language</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-white/5"><Star className="w-5 h-5 text-[#d4af37]" /></div>
                            <div className="flex flex-col">
                                <span className="text-white font-bold text-lg">4.8</span>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Rating</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-white/5"><Clock className="w-5 h-5 text-[#d4af37]" /></div>
                            <div className="flex flex-col">
                                <span className="text-white font-bold text-lg">~12h</span>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Read Time</span>
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
                            onClick={() => navigate(`/read/${book.id}`)}
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
                                onClick={() => setIsFavorite(!isFavorite)}
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