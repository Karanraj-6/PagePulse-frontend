import type { Book, User, Conversation, Message } from './api';

// Mock data for development/demo purposes

export const mockBooks: Book[] = [
  {
    id: '1',
    title: 'Harry Potter and the Sorcerer\'s Stone',
    author: 'J.K. Rowling',
    coverImage: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=300&h=400&fit=crop',
    description: 'The first book in the Harry Potter series, following the young wizard Harry Potter as he discovers his magical heritage and begins his journey at Hogwarts School of Witchcraft and Wizardry.',
    category: 'Fantasy',
    rating: 4.8,
    totalPages: 309,
  },
  {
    id: '2',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop',
    description: 'A romantic novel following the emotional development of Elizabeth Bennet, who learns the error of making hasty judgments.',
    category: 'Romantic',
    rating: 4.7,
    totalPages: 432,
  },
  {
    id: '3',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop',
    description: 'A story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.',
    category: 'Classic',
    rating: 4.5,
    totalPages: 180,
  },
  {
    id: '4',
    title: '1984',
    author: 'George Orwell',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop',
    description: 'A dystopian novel set in a totalitarian society ruled by the omnipresent Big Brother.',
    category: 'Sci-Fi',
    rating: 4.6,
    totalPages: 328,
  },
  {
    id: '5',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    coverImage: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=300&h=400&fit=crop',
    description: 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.',
    category: 'Classic',
    rating: 4.8,
    totalPages: 281,
  },
  {
    id: '6',
    title: 'The Notebook',
    author: 'Nicholas Sparks',
    coverImage: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=300&h=400&fit=crop',
    description: 'A story about the enduring power of love, a story of miracles that will stay with you forever.',
    category: 'Romantic',
    rating: 4.4,
    totalPages: 214,
  },
  {
    id: '7',
    title: 'The Fault in Our Stars',
    author: 'John Green',
    coverImage: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&h=400&fit=crop',
    description: 'A heart-wrenching love story between two teenagers who meet at a cancer support group.',
    category: 'Romantic',
    rating: 4.5,
    totalPages: 313,
  },
  {
    id: '8',
    title: 'Dune',
    author: 'Frank Herbert',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=400&fit=crop',
    description: 'Set in the distant future, Dune tells the story of Paul Atreides on the desert planet Arrakis.',
    category: 'Sci-Fi',
    rating: 4.7,
    totalPages: 688,
  },
];

export const mockUser: User = {
  id: '1',
  username: 'bookworm42',
  email: 'bookworm@example.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  createdAt: '2024-01-15T00:00:00Z',
};

export const mockConversations: Conversation[] = [
  {
    id: '1',
    participant: {
      id: '2',
      username: 'reader_jane',
      email: 'jane@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      createdAt: '2024-02-01T00:00:00Z',
    },
    lastMessage: {
      id: '1',
      content: 'Have you finished reading chapter 5?',
      senderId: '2',
      createdAt: '2025-01-27T14:30:00Z',
    },
    updatedAt: '2025-01-27T14:30:00Z',
  },
  {
    id: '2',
    participant: {
      id: '3',
      username: 'novel_lover',
      email: 'novel@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      createdAt: '2024-03-10T00:00:00Z',
    },
    lastMessage: {
      id: '2',
      content: 'That plot twist was amazing! 😱',
      senderId: '1',
      createdAt: '2025-01-26T18:45:00Z',
    },
    updatedAt: '2025-01-26T18:45:00Z',
  },
  {
    id: '3',
    participant: {
      id: '4',
      username: 'fantasy_fan',
      email: 'fantasy@example.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      createdAt: '2024-04-20T00:00:00Z',
    },
    lastMessage: {
      id: '3',
      content: 'Let\'s start a new book together!',
      senderId: '4',
      createdAt: '2025-01-25T10:00:00Z',
    },
    updatedAt: '2025-01-25T10:00:00Z',
  },
];

export const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Hey! Are you reading Harry Potter too?',
    senderId: '2',
    createdAt: '2025-01-27T14:00:00Z',
  },
  {
    id: '2',
    content: 'Yes! I just started it yesterday. So good!',
    senderId: '1',
    createdAt: '2025-01-27T14:05:00Z',
  },
  {
    id: '3',
    content: 'Which chapter are you on?',
    senderId: '2',
    createdAt: '2025-01-27T14:10:00Z',
  },
  {
    id: '4',
    content: 'Chapter 3 - The Letters from No One',
    senderId: '1',
    createdAt: '2025-01-27T14:15:00Z',
  },
  {
    id: '5',
    content: 'Have you finished reading chapter 5?',
    senderId: '2',
    createdAt: '2025-01-27T14:30:00Z',
  },
];

export const mockBookContent = {
  tableOfContents: [
    { chapter: 1, title: 'The Psychohistorians', page: 1 },
    { chapter: 2, title: 'The Encyclopedists', page: 45 },
    { chapter: 3, title: 'The Mayors', page: 89 },
    { chapter: 4, title: 'The Traders', page: 147 },
    { chapter: 5, title: 'The Merchant Princes', page: 193 },
  ],
  sampleContent: `HARI SELDON — ... born in the 11,988th year of the Galactic Era; died 12,069. The dates are more commonly given in terms of the current Foundational Era as -79 to the year 1 F.E. Born to middle-class parents on Helicon, Arcturus sector (where his father, in a legend of doubtful authenticity, was a tobacco grower in the hydroponic plants of the planet), he early showed amazing ability in mathematics.

His contributions to the development of probability theory and psychohistory are described in the Encyclopedia as follows...

The course of Seldon's career has been the subject of many books, and it would be impossible in the space of this article to do more than touch on the highlights. Nevertheless, it is essential to understand certain aspects of his personality and background in order to appreciate his later work.

Seldon was educated at the Imperial University of Streeling, where he came under the influence of...`,
};

export const categories = [
  'Trending',
  'Romantic',
  'Fantasy',
  'Sci-Fi',
  'Classic',
  'Mystery',
  'Horror',
  'Biography',
];

export const mockNotifications = [
  {
    id: '1',
    title: 'New Book Arrival',
    message: 'The latest edition of "The Great Gatsby" is now available.',
    time: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    title: 'Friend Request',
    message: 'John Doe sent you a friend request.',
    time: '5 hours ago',
    read: true,
  },
  {
    id: '3',
    title: 'Reading Session Invite',
    message: 'Alice invited you to join "Fantasy Book Club".',
    time: '1 day ago',
    read: false,
  },
  {
    id: '4',
    title: 'System Update',
    message: 'PagePulse will be undergoing maintenance tonight.',
    time: '2 days ago',
    read: true,
  },
  {
    id: '5',
    title: 'New Comment',
    message: 'Sarah commented on your review of "Dune".',
    time: '3 days ago',
    read: true,
  },
];
