// API service layer - Connected to Microservices

const mockNotifications: Notification[] = [
  { id: '1', title: 'New Book Arrival', message: 'The latest edition of "The Great Gatsby" is now available.', time: '2 hours ago', read: false },
  { id: '2', title: 'Friend Request', message: 'John Doe sent you a friend request.', time: '5 hours ago', read: true },
];

const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3001';
const BOOK_URL = import.meta.env.VITE_BOOK_URL || 'http://localhost:3002';
const CHAT_URL = import.meta.env.VITE_CHAT_URL || 'http://localhost:3003';

// Cookie Helpers - Use 'token' to match backend
export const getAuthToken = (): string | null => {
  const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
  return match ? match[2] : null;
};

export const setAuthToken = (token: string) => {
  document.cookie = `token=${token}; path=/; max-age=3600; SameSite=lax`;
};

export const clearAuthToken = () => {
  document.cookie = 'token=; path=/; max-age=0';
};

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  baseUrl?: string;
  params?: Record<string, string | number | undefined>;
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, baseUrl, params } = options;

  if (!baseUrl) {
    throw new Error('Base URL is required for API requests');
  }

  const token = getAuthToken();

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    credentials: 'include',
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  let url = `${baseUrl}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, config);

  // Handle 202 responses (for ingestion)
  if (response.status === 202) {
    const data = await response.json();
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return { ...data, _httpStatus: 202 } as T;
    }
    return data as T;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || 'API request failed');
  }

  const data = await response.json();

  // Only add _httpStatus if data is an object (not array)
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return { ...data, _httpStatus: response.status } as T;
  }

  return data as T;
}

// Helper to make requests to specific services
const authRequest = <T>(endpoint: string, options: ApiOptions = {}) =>
  apiRequest<T>(endpoint, { ...options, baseUrl: AUTH_URL });

const bookRequest = <T>(endpoint: string, options: ApiOptions = {}) =>
  apiRequest<T>(endpoint, { ...options, baseUrl: BOOK_URL });

const chatRequest = <T>(endpoint: string, options: ApiOptions = {}) =>
  apiRequest<T>(endpoint, { ...options, baseUrl: CHAT_URL });

// Auth Service
export const authApi = {
  register: (data: SignupData) => authRequest<{ userId: string; username: string; token: string }>('/auth/register', { method: 'POST', body: data }),

  login: async (email: string, password: string) => {
    const response = await authRequest<{ token: string; user: { id: string; name: string; email: string; avatar: string | null } }>('/auth/login', {
      method: 'POST',
      body: { username: email, password }
    });

    if (response.token) {
      setAuthToken(response.token);
    }

    const user: User = {
      id: response.user.id,
      username: response.user.name,
      email: response.user.email,
      avatar: response.user.avatar || undefined,
    };

    return { user, token: response.token };
  },

  getCurrentUser: () => authRequest<User>('/auth/me'),

  logout: () => {
    clearAuthToken();
  },

  searchUsers: (query: string) =>
    authRequest<User[]>('/users', {
      params: { q: query },
    }),

  getFriends: (userId: string) =>
    authRequest<Friend[]>('/friends', {
      params: { userId },
    }),

  manageFriendship: (myId: string, targetId: string, action: 'add' | 'block') =>
    authRequest<void>('/friends', {
      method: 'POST',
      body: { myId, targetId, action },
    }),

  acceptFriendRequest: (myId: string, targetId: string) =>
    authRequest<void>('/friends', {
      method: 'PUT',
      body: { myId, targetId },
    }),
};

// Book Service
export const booksApi = {
  getBooks: (page: number = 1, category?: string, search?: string) =>
    bookRequest<Book[]>('/books', {
      params: { page, category, search },
    }),

  getTrending: () => bookRequest<Book[]>('/books/trending'),

  getById: (id: string) => bookRequest<Book>(`/books/${id}`),

  getPages: (id: string, limit: number = 20, offset: number = 0) =>
    bookRequest<PagesResponse>(`/books/${id}/pages`, {
      params: { limit, offset },
    }),

  getIngestionStatus: (id: string) =>
    bookRequest<{ status: string; message?: string; page_count?: number; error?: string }>(
      `/books/${id}/ingestion-status`
    ),

  getCategories: () => bookRequest<string[]>('/categories'),

  trackBook: (book: Book) =>
    bookRequest<{ success: boolean }>(`/books/${book.id}/track`, {
      method: 'POST',
      body: {
        title: book.title,
        authors: book.authors,
        formats: book.formats,
        download_count: book.download_count
      }
    }),
};

// Chat Service
export const chatApi = {
  initiatePrivateChat: (myId: string, targetUserId: string) =>
    chatRequest<{ conversationId: string; created: boolean }>('/private', {
      method: 'POST',
      body: { myId, targetUserId },
    }),

  initiateReadingSession: (myId: string, bookId: string, friendUsername?: string) =>
    chatRequest<{ conversationId: string }>('/reading', {
      method: 'POST',
      body: { myId, bookId, friendUsername },
    }),

  // [UPDATED] Get list of conversations for a user
  getConversations: (userId: string) => chatRequest<ConversationsResponse>(`/conversations/${userId}`),

  // [UPDATED] Get message history with pagination
  getPrivateMessages: (conversationId: string, limit: number = 50, before?: string) =>
    chatRequest<MessageHistoryResponse>(`/private/${conversationId}/messages`, {
      params: { limit, before },
    }),
};

// ... (User API and Notification API remain unchanged) ...

// Types
export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
}

export interface Friend {
  user_id: string;
  username: string;
  status: 'accepted' | 'pending' | 'blocked';
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
}

export interface Author {
  name: string;
  birth_year?: number;
  death_year?: number;
}

export interface Book {
  id: number;
  title: string;
  authors: Author[];
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  copyright: boolean;
  media_type: string;
  formats: Record<string, string>;
  download_count: number;
  summaries?: string[]; // Added based on usage in BookDetailPage
}

export interface BookPage {
  page: number;
  html: string;
}

export interface PagesResponse {
  book_id: number;
  title: string;
  total_pages: number;
  limit: number;
  offset: number;
  has_more: boolean;
  pages: BookPage[];
  status?: string;
  message?: string;
  estimated_time?: string;
  _httpStatus?: number;
}

export interface BookPagesResponse {
  book_id: number;
  title: string;
  total_pages: number;
  pages: BookPage[];
}

// [UPDATED] Matches API Response
export interface Conversation {
  conversation_id: string; // Changed from id
  type: 'private' | 'reading';
  created_at: string;
  last_message?: {
    message_id: string;
    sender_id: string;
    content: string;
    sent_at: string;
  };
  other_participants: string[];
  // Helper for UI (computed)
  participantDetails?: User;
}

export interface ConversationsResponse {
  conversations: Conversation[];
}

export interface Message {
  message_id: string; // Changed from id
  conversation_id: string;
  sender_id: string; // Changed from senderId
  content: string;
  sent_at: string; // Changed from createdAt
}

export interface MessageHistoryResponse {
  messages: Message[];
  hasMore: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// User API
export const userApi = {
  getProfile: (userId: string) => authRequest<User>(`/users/${userId}`),

  updateProfile: (data: Partial<User>) => authRequest<User>('/users/profile', { method: 'PUT', body: data }),

  uploadAvatar: async (file: File): Promise<{ success: boolean; avatarUrl: string }> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${AUTH_URL}/users/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || 'Avatar upload failed');
    }

    return response.json();
  },
};

// Notification API (Mock)
export const notificationApi = {
  getUpdates: () => Promise.resolve(mockNotifications),
};

export default {
  auth: authApi,
  books: booksApi,
  chat: chatApi,
  user: userApi,
  notifications: notificationApi,
};