// API service layer - Connected to Microservices

// API service layer - Connected to Microservices


const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3001';
const BOOK_URL = import.meta.env.VITE_BOOK_URL || 'http://localhost:3002';
const CHAT_URL = import.meta.env.VITE_CHAT_URL || 'http://localhost:3003';
const NOTIFICATION_URL = import.meta.env.VITE_NOTIFICATION_URL || 'http://localhost:3007';

// Cookie Helpers - Use 'token' to match backend
export const getAuthToken = (): string | null => {
  const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
  return match ? match[2] : null;
};

export const setAuthToken = (token: string) => {
  document.cookie = `token=${token}; path=/; max-age=3600; SameSite=lax`;
};

export const clearAuthToken = () => {
  // Clear with standard path
  document.cookie = 'token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  // Clear with SameSite matching the setter
  document.cookie = 'token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
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

const notificationRequest = <T>(endpoint: string, options: ApiOptions = {}) =>
  apiRequest<T>(endpoint, { ...options, baseUrl: NOTIFICATION_URL });

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

    const avatarUrl = response.user.avatar;
    const fullAvatarUrl = avatarUrl?.startsWith('/')
      ? `${AUTH_URL}${avatarUrl}`
      : avatarUrl;

    const user: User = {
      id: response.user.id,
      username: response.user.name,
      email: response.user.email,
      avatar: fullAvatarUrl || undefined,
    };

    return { user, token: response.token };
  },

  getCurrentUser: async () => {
    const user = await authRequest<User>('/auth/me');
    if (user.avatar?.startsWith('/')) {
      user.avatar = `${AUTH_URL}${user.avatar}`;
    }
    return user;
  },

  logout: async () => {
    try {
      await authRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn("Server-side logout failed (endpoint might be missing)", error);
    }
    clearAuthToken();
  },

  searchUsers: async (query: string) => {
    const users = await authRequest<any[]>('/users', {
      params: { q: query },
    });
    return users.map(u => ({
      ...u,
      id: u.user_id || u.id || u._id, // Handle backend variations
      avatar: u.avatar?.startsWith('/') ? `${AUTH_URL}${u.avatar}` : u.avatar,
    })) as User[];
  },

  // New filtered search for adding friends
  searchNewFriends: async (query: string, userId: string) => {
    const users = await authRequest<any[]>('/addfriends', {
      params: { q: query, userId },
    });
    return users.map(u => ({
      ...u,
      id: u.user_id || u.id || u._id,
      avatar: u.avatar?.startsWith('/') ? `${AUTH_URL}${u.avatar}` : u.avatar,
    })) as User[];
  },

  getFriends: async (userId: string) => {
    const friends = await authRequest<Friend[]>('/friends', {
      params: { userId },
    });
    return friends.map(f => ({
      ...f,
      avatar: f.avatar?.startsWith('/') ? `${AUTH_URL}${f.avatar}` : f.avatar,
    }));
  },

  // Only 'add' remains on Auth service (port 3001)
  sendFriendRequest: (myId: string, targetId: string) =>
    authRequest<{ success: boolean; status: string }>('/friends', {
      method: 'POST',
      body: { myId, targetId, action: 'add' },
    }),

  // Favorites
  getFavorites: () =>
    authRequest<number[]>('/favorites'),

  addFavorite: (bookId: string | number) =>
    authRequest<{ success: boolean; message: string }>(`/favorites/${bookId}`, {
      method: 'POST',
    }),

  removeFavorite: (bookId: string | number) =>
    authRequest<{ success: boolean }>(`/favorites/${bookId}`, {
      method: 'DELETE',
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
        download_count: book.download_count,
        summaries: book.summaries || []
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

  // [NEW] Get user details via Chat Service (gRPC proxy to Auth)
  getChatUser: async (userId: string) => {
    const user = await chatRequest<User>(`/chatusers/${userId}`);
    if (user.avatar?.startsWith('/')) {
      user.avatar = `${AUTH_URL}${user.avatar}`;
    }
    return user;
  },

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
  avatar?: string; // Added to support profile pics in friend list
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
  id: number | string;
  _id?: string;
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
  _id: string; // MongoDB ObjectId
  receiver_id: string;
  sender_id: string;
  sender_username: string;
  type: 'friend_requested' | 'friend_accepted' | 'welcome' | 'invitation';
  message: string;
  read: boolean;
  created_at: string;
}

// User API
export const userApi = {
  getProfile: async (userId: string) => {
    // Try direct ID fetch first
    try {
      return await authRequest<User>(`/users/${userId}`);
    } catch (err: any) {
      // If 404, try searching for the ID (backend might not have /users/:id but `q` search might include IDs or we can find by username if we had it)
      // Since we only have ID, we try passing ID to search.
      if (err.message && err.message.includes('404')) {
        console.warn(`getProfile: /users/${userId} failed (404). Falling back to search.`);
        const users = await authRequest<any[]>('/users', { params: { q: userId } });
        const found = users.find(u => u.user_id === userId || u.id === userId);
        if (found) {
          return {
            ...found,
            id: found.user_id || found.id || found._id,
            username: found.username,
            avatar: found.avatar
          } as User;
        }
      }
      throw err;
    }
  },

  updateProfile: (data: Partial<User>) => authRequest<User>('/users/profile', { method: 'PUT', body: data }),

  uploadAvatar: async (file: File): Promise<{ success: boolean; avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${AUTH_URL}/users/avatar`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || 'Avatar upload failed');
    }

    const data = await response.json();
    if (data.avatarUrl?.startsWith('/')) {
      data.avatarUrl = `${AUTH_URL}${data.avatarUrl}`;
    }
    return data;
  },
};

// Notification & Friend Action Service (Port 3007)
export const notificationApi = {
  // Notifications
  getNotifications: (userId: string, unreadOnly?: boolean) =>
    notificationRequest<Notification[]>(`/notifications/${userId}`, {
      params: { unreadOnly: unreadOnly ? 'true' : undefined }
    }),

  getUnreadCount: (userId: string) =>
    notificationRequest<{ count: number }>(`/notifications/${userId}/count`),

  markAsRead: (id: string) =>
    notificationRequest<void>(`/notifications/${id}/read`, { method: 'PUT' }),

  markAllAsRead: (userId: string) =>
    notificationRequest<void>(`/notifications/${userId}/read-all`, { method: 'PUT' }),

  deleteNotification: (id: string) =>
    notificationRequest<void>(`/notifications/${id}`, { method: 'DELETE' }),

  // Friend Actions via Notification (Accept/Reject/Block)
  acceptRequestFromNotification: (notificationId: string) =>
    notificationRequest<{ success: boolean; message: string; new_status: string; deleted?: boolean }>(
      `/notifications/${notificationId}/accept`, { method: 'POST' }
    ),

  rejectRequestFromNotification: (notificationId: string) =>
    notificationRequest<{ success: boolean; message: string; new_status: string; deleted?: boolean }>(
      `/notifications/${notificationId}/reject`, { method: 'POST' }
    ),

  blockUserFromNotification: (notificationId: string) =>
    notificationRequest<{ success: boolean; message: string; new_status: string; deleted?: boolean }>(
      `/notifications/${notificationId}/block`, { method: 'POST' }
    ),

  // Direct Friend Actions (No notification ID required)
  acceptFriendRequest: (userId: string, targetId: string) =>
    notificationRequest<{ success: boolean; message: string; new_status: string }>('/friends/accept', {
      method: 'POST',
      body: { userId, targetId }
    }),

  rejectFriendRequest: (userId: string, targetId: string) =>
    notificationRequest<{ success: boolean; message: string; new_status: string }>('/friends/reject', {
      method: 'POST',
      body: { userId, targetId }
    }),

  blockUser: (userId: string, targetId: string) =>
    notificationRequest<{ success: boolean; message: string; new_status: string }>('/friends/block', {
      method: 'POST',
      body: { userId, targetId }
    }),
};

// Invitation Service (Port 3007 - likely same as notifications)
export const invitationApi = {
  sendInvitation: (senderId: string, receiverId: string, bookId: string, bookTitle: string) =>
    notificationRequest<{ success: boolean; invitationId: string; notificationId: string }>('/invitations', {
      method: 'POST',
      body: { sender_id: senderId, receiver_id: receiverId, book_id: bookId, book_title: bookTitle }
    }),

  getInvitations: (userId: string) =>
    notificationRequest<any[]>(`/invitations/${userId}`),

  deleteInvitation: (id: string) =>
    notificationRequest<void>(`/invitations/${id}`, { method: 'DELETE' }),
};

export default {
  auth: authApi,
  books: booksApi,
  chat: chatApi,
  user: userApi,
  notifications: notificationApi,
  invitations: invitationApi,
};