import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getAuthToken } from '../services/api';

const CHAT_SERVICE_URL = import.meta.env.VITE_CHAT_URL || 'http://localhost:3005';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Only connect if user is logged in
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        // Initialize socket connection
        const token = getAuthToken();
        const newSocket = io(CHAT_SERVICE_URL, {
            auth: { token },
            withCredentials: true,
            transports: ['websocket'], // Prefer WebSocket
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
            // Explicitly register user ID with the backend socket map
            if (user?.id) {
                newSocket.emit('register', user.id);
                console.log('📝 Registered socket for user:', user.id);
            }
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
            setIsConnected(false);
        });

        newSocket.on('error', (err: any) => {
            console.error('⚠️ Socket error:', err);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user?.id]); // Re-connect only if user changes

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
