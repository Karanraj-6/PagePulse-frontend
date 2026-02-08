import React, { useMemo } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "../components/ui/pagination";

interface BookViewerProps {
    pages: (string | null)[];
    isLoading: boolean;
    isIngesting: boolean;
    isFetchingBatch: boolean;
    ingestionMessage: string;
    currentSpread: number;
    totalSpreads: number;
    onFlip: (e: { data: number }) => void;
    onPrev: () => void;
    onNext: () => void;
    bookRef: React.MutableRefObject<any>;
}

// Generate iframe content helper
const generateIframeContent = (htmlChunk: string) => `
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
</html>`;

const LoadingPage = ({ number }: { number: number }) => (
    <div className="h-full w-full bg-[#fdfbf7] border-r border-[#e3d5c6] flex flex-col items-center justify-center relative">
        <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin mb-4" />
        <span className="text-zinc-400 text-xs font-serif tracking-widest">LOADING PAGE {number}</span>
        <div className="absolute bottom-4 left-0 right-0 text-center text-[#a8a8a8] text-[10px]">{number}</div>
    </div>
);

const BookViewer = React.memo(({
    pages,
    isLoading,
    isIngesting,
    isFetchingBatch,
    ingestionMessage,
    currentSpread,
    totalSpreads,
    onFlip,
    onPrev,
    onNext,
    bookRef
}: BookViewerProps) => {

    // Memoize page contents to prevent iframe reload on parent re-renders
    const memoizedPageContents = useMemo(() => {
        return pages.map((htmlChunk) => htmlChunk ? generateIframeContent(htmlChunk) : null);
    }, [pages]);

    // LOADING STATE
    if (isLoading) {
        return (
            <div className="flex-1 min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4af37]" />
            </div>
        );
    }

    // INGESTION STATE
    if (isIngesting) {
        return (
            <div className="flex-1 min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
                <Loader2 className="w-16 h-16 text-[#d4af37] animate-spin mb-6" />
                <h2 className="text-2xl font-bold mb-2">Preparing Your Book</h2>
                <p className="text-zinc-400 text-center max-w-md">{ingestionMessage}</p>
                <p className="text-zinc-500 text-sm mt-4">This may take a minute for first-time reads...</p>
            </div>
        );
    }

    return (
        <main className="flex-1 relative flex flex-col items-center justify-center p-4 lg:p-8 overflow-hidden bg-[#111]">
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
                        /* Missing Props Fix */
                        style={{}}
                        startPage={0}
                        drawShadow={true}
                        flippingTime={1000}
                        usePortrait={true}
                        startZIndex={0}
                        autoSize={true}
                        clickEventForward={true}
                        useMouseEvents={true}
                        swipeDistance={30}
                        showPageCorners={true}
                        disableFlipByClick={false}
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

            <button onClick={onPrev} className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/5 hover:bg-[#d4af37] text-white hover:text-black flex items-center justify-center transition-all z-20"><ChevronLeft className="w-6 h-6" /></button>
            <button onClick={onNext} className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/5 hover:bg-[#d4af37] text-white hover:text-black flex items-center justify-center transition-all z-20"><ChevronRight className="w-6 h-6" /></button>

            <div className="absolute bottom-6 z-20">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem><PaginationPrevious onClick={(e) => { e.preventDefault(); onPrev(); }} className="cursor-pointer text-zinc-400 hover:text-[#d4af37]" /></PaginationItem>
                        <PaginationItem><span className="text-zinc-500 text-sm px-4">Spread <span className="text-[#d4af37]">{currentSpread}</span> of {totalSpreads}</span></PaginationItem>
                        <PaginationItem><PaginationNext onClick={(e) => { e.preventDefault(); onNext(); }} className="cursor-pointer text-zinc-400 hover:text-[#d4af37]" /></PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </main>
    );
});

export default BookViewer;
