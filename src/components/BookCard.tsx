import { useNavigate } from 'react-router-dom';
import type { Book } from '../services/api';

interface BookCardProps {
  book: Book;
  size?: 'small' | 'medium' | 'large';
}

const BookCard = ({ book, size = 'medium' }: BookCardProps) => {
  const navigate = useNavigate();

  const sizeClasses = {
    small: 'w-32 h-48',
    medium: 'w-40 h-56',
    large: 'w-48 h-64',
  };

  return (
    <div
      onClick={() => navigate(`/book/${book.id}`)}
      className={`${sizeClasses[size]} flex-shrink-0 rounded-xl overflow-hidden cursor-pointer group relative transition-transform hover:scale-105`}
    >
      {/* Cover Image */}
      <img
        src={book.coverImage}
        alt={book.title}
        className="w-full h-full object-cover"
      />

      {/* Gradient Overlay - Always visible */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Title - Always visible at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-sm font-semibold text-white truncate">{book.title}</h3>
        <p className="text-xs text-light-text truncate">{book.author}</p>
      </div>

      {/* Rating Badge */}
      <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md text-xs font-medium text-white flex items-center gap-1">
        <span className="text-yellow-400">★</span> {book.rating}
      </div>
    </div>
  );
};

export default BookCard;
