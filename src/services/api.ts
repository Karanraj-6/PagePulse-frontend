// API service layer - Ready to connect to backend
import { mockNotifications } from './mockData';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const token = localStorage.getItem('authToken');

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  signup: (data: SignupData) =>
    apiRequest<{ token: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: data,
    }),

  logout: () => {
    localStorage.removeItem('authToken');
  },

  getCurrentUser: () => apiRequest<User>('/auth/me'),
};

// Books API
export const booksApi = {
  getTrending: () => apiRequest<Book[]>('/books/trending'),

  getByCategory: (category: string) =>
    apiRequest<Book[]>(`/books/category/${category}`),

  search: (query: string) =>
    apiRequest<Book[]>(`/books/search?q=${encodeURIComponent(query)}`),

  getById: (id: string) => apiRequest<Book>(`/books/${id}`),

  getContent: (id: string, page: number) =>
    apiRequest<BookContent>(`/books/${id}/content?page=${page}`),
};

// Chat API
export const chatApi = {
  getConversations: () => apiRequest<Conversation[]>('/chats'),

  getMessages: (conversationId: string) =>
    apiRequest<Message[]>(`/chats/${conversationId}/messages`),

  sendMessage: (conversationId: string, content: string) =>
    apiRequest<Message>(`/chats/${conversationId}/messages`, {
      method: 'POST',
      body: { content },
    }),

  createConversation: (userId: string) =>
    apiRequest<Conversation>('/chats', {
      method: 'POST',
      body: { userId },
    }),
};

// Reading Session API
export const readingApi = {
  inviteFriend: (bookId: string, friendId: string) =>
    apiRequest<ReadingSession>('/reading/invite', {
      method: 'POST',
      body: { bookId, friendId },
    }),

  addComment: (sessionId: string, page: number, comment: string) =>
    apiRequest<Comment>(`/reading/${sessionId}/comments`, {
      method: 'POST',
      body: { page, comment },
    }),

  getComments: (sessionId: string, page: number) =>
    apiRequest<Comment[]>(`/reading/${sessionId}/comments?page=${page}`),
};

// User API
export const userApi = {
  getProfile: (userId: string) => apiRequest<User>(`/users/${userId}`),

  updateProfile: (data: Partial<User>) =>
    apiRequest<User>('/users/profile', {
      method: 'PUT',
      body: data,
    }),

  searchUsers: (query: string) =>
    apiRequest<User[]>(`/users/search?q=${encodeURIComponent(query)}`),
};

// Notification API
export const notificationApi = {
  getUpdates: () => Promise.resolve(mockNotifications),
};

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  description: string;
  category: string;
  rating: number;
  totalPages: number;
}

export interface BookContent {
  page: number;
  content: string;
  totalPages: number;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage?: Message;
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

export interface ReadingSession {
  id: string;
  bookId: string;
  participants: User[];
  currentPage: number;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  content: string;
  page: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default {
  auth: authApi,
  books: booksApi,
  chat: chatApi,
  reading: readingApi,
  user: userApi,
  notifications: notificationApi,
};
