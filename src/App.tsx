import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import GlobalNotifications from './components/GlobalNotifications';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import BookDetailPage from './pages/BookDetailPage';
import BookReaderPage from './pages/BookReaderPage';
import ChatsListPage from './pages/ChatsListPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import Prism from './components/Prism.jsx';
import './components/Prism.css';



function App() {
  return (
    <div className="relative z-10">
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <Router>
              <GlobalNotifications />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />

                {/* Protected Routes */}
                <Route
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <HomePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <SearchPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/books/:id/:slug"
                  element={
                    <ProtectedRoute>
                      <BookDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/books/:id/:slug/read"
                  element={
                    <ProtectedRoute>
                      <BookReaderPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chats"
                  element={
                    <ProtectedRoute>
                      <ChatsListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chats/:username"
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
