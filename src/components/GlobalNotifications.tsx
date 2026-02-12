import { useEffect, useRef } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { userApi, authApi, type Message } from '../services/api';

const GlobalNotifications = () => {
    const { socket } = useSocket();
    const { showToast } = useToast();
    const { user } = useAuth();
    const location = useLocation();

    // Cache friends for name lookup
    const friendsMap = useRef<Record<string, string>>({});

    // Debug log to confirm component mount
    useEffect(() => {
        // Component mounted
    }, [socket, user]);

    // Fetch and cache friends list on mount
    useEffect(() => {
        if (!user) return;
        const fetchFriends = async () => {
            try {
                const friends = await authApi.getFriends(user.id);
                if (friends && Array.isArray(friends)) {
                    friends.forEach(f => {
                        friendsMap.current[f.user_id] = f.username;
                    });
                }
            } catch (e) {
                console.error("GlobalNotifications: Failed to cache friends", e);
            }
        };
        fetchFriends();
    }, [user]);

    useEffect(() => {
        if (!socket || !user) return;

        const handleReceiveMessage = async (msg: Message) => {

            if (msg.sender_id === user.id) return;

            // Check if we are currently chatting with this user
            const match = matchPath('/chats/:username', location.pathname);
            const currentChatUsername = match?.params.username;

            // Prepare truncated content
            const MAX_LENGTH = 35;
            const content = msg.content || "Sent an attachment";
            const truncatedContent = content.length > MAX_LENGTH
                ? content.substring(0, MAX_LENGTH) + "..."
                : content;

            try {
                // Optimized Name Lookup: Cache -> API
                let senderName = friendsMap.current[msg.sender_id];

                if (!senderName) {
                    const senderProfile = await userApi.getProfile(msg.sender_id);
                    senderName = senderProfile.username;
                    // Cache it for next time
                    friendsMap.current[msg.sender_id] = senderName;
                } else {
                    // Start logic same as before
                }


                // Check if we are currently looking at this chat
                if (currentChatUsername && currentChatUsername.toLowerCase() === senderName.toLowerCase()) {
                    return;
                }

                showToast(`${senderName}: ${truncatedContent}`, 'info');

            } catch (err) {
                console.error("GlobalNotifications: Failed to fetch sender info", err);
                // Fallback: Clean display even if name lookup fails completely
                showToast(`Message: ${truncatedContent}`, 'info');
            }
        };

        const handleNotification = (data: any) => {
            // Handle Invitation Toast
            if (data.type === 'invitation') {
                showToast(data.message || "You have a new book invitation!", 'invitation');
            }
            // Handle Friend Request Toast
            else if (data.type === 'friend_requested') {
                showToast(data.message || "You have a new friend request!", 'info');
            }
            // Handle Friend Acceptance Toast
            else if (data.type === 'friend_accepted') {
                showToast(data.message || "Friend request accepted!", 'success');
            }
            // Handle Welcome Toast
            else if (data.type === 'welcome') {
                showToast(data.message || "Welcome to PagePulse!", 'info');
            }
        };

        socket.on('receive_private_message', handleReceiveMessage);
        socket.on('receive_notification', handleNotification);

        return () => {
            socket.off('receive_private_message', handleReceiveMessage);
            socket.off('receive_notification', handleNotification);
        };
    }, [socket, user, location.pathname, showToast]);

    return null;
};

export default GlobalNotifications;
