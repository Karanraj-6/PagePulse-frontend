import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Book } from '../services/api';
import BookCard from './BookCard';

interface BookRowProps {
  title: string;
  books: Book[];
}

const BookRow = ({ title, books }: BookRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="mb-8">
      {/* Title */}
      <h2 className="text-xl font-bold mb-4 px-4 text-white">{title}</h2>

      {/* Scrollable container */}
      <div className="relative group px-4">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute -left-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-dark/90 backdrop-blur-sm border border-dark-border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-dark-surface-light shadow-lg"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Books */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar scroll-smooth"
        >
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute -right-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-dark/90 backdrop-blur-sm border border-dark-border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-dark-surface-light shadow-lg"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
};

export default BookRow;
