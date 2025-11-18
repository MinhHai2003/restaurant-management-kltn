import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';
import type { Message } from '../services/chatService';

interface UseAdminChatSocketOptions {
  conversationId?: string;
  onMessageReceived?: (message: Message) => void;
  onTyping?: (data: { userId: string; userName: string; isTyping: boolean }) => void;
  onNewConversation?: (data: any) => void;
}

export const useAdminChatSocket = (options: UseAdminChatSocketOptions = {}) => {
  const { conversationId, onMessageReceived, onTyping, onNewConversation } = options;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('employeeToken');

    if (!token) {
      setError('No authentication token found');
      return;
    }

    // Get socket URL from customer service
    // Socket.io needs base URL without /api suffix
    let socketUrl = API_CONFIG.CHAT_SOCKET_URL || '';
    
    // If CHAT_SOCKET_URL is empty, derive from CUSTOMER_API
    if (!socketUrl || socketUrl.trim() === '') {
      socketUrl = API_CONFIG.CUSTOMER_API;
    }
    
    // CRITICAL: Remove /api suffix and trailing slash - Socket.io needs base URL only
    socketUrl = socketUrl
      .replace(/\/api\/?$/, '')  // Remove /api or /api/
      .replace(/\/$/, '');        // Remove trailing slash
    
    // Final validation - ensure no /api in URL
    if (socketUrl.includes('/api')) {
      console.warn('⚠️ [useAdminChatSocket] Warning: socketUrl still contains /api, removing...');
      socketUrl = socketUrl.replace(/\/api.*$/, '');
    }

    console.log('🔌 [useAdminChatSocket] Connecting to:', socketUrl);
    console.log('🔌 [useAdminChatSocket] CUSTOMER_API:', API_CONFIG.CUSTOMER_API);
    console.log('🔌 [useAdminChatSocket] CHAT_SOCKET_URL (raw):', API_CONFIG.CHAT_SOCKET_URL);
    console.log('🔌 [useAdminChatSocket] Final socketUrl:', socketUrl);

    const newSocket = io(socketUrl, {
      auth: {
        token,
        type: 'admin',
      },
      // Railway: Try polling first, then upgrade to websocket
      transports: ['polling', 'websocket'],
      path: '/socket.io/',
      // Railway specific settings
      upgrade: true,
      rememberUpgrade: false,
      timeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection handlers
    newSocket.on('connect', () => {
      console.log('✅ [useAdminChatSocket] Connected:', newSocket.id);
      setIsConnected(true);
      setError(null);

      // Join conversation if provided
      if (conversationId) {
        newSocket.emit('join_conversation', conversationId);
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ [useAdminChatSocket] Connection error:', err);
      setError(err.message || 'Connection failed');
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 [useAdminChatSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    // Message handlers
    newSocket.on('message_received', (data: Message) => {
      console.log('📨 [useAdminChatSocket] Message received:', data);
      if (onMessageReceived) {
        onMessageReceived(data);
      }
    });

    newSocket.on('message_sent', (data: { success: boolean; messageId?: string }) => {
      console.log('✅ [useAdminChatSocket] Message sent:', data);
    });

    newSocket.on('new_customer_message', (data: any) => {
      console.log('📬 [useAdminChatSocket] New customer message:', data);
      if (onNewConversation) {
        onNewConversation(data);
      }
    });

    newSocket.on('typing_indicator', (data: {
      userId: string;
      userName: string;
      userType: string;
      isTyping: boolean;
    }) => {
      if (onTyping) {
        onTyping({
          userId: data.userId,
          userName: data.userName,
          isTyping: data.isTyping,
        });
      }
    });

    newSocket.on('error', (data: { message: string }) => {
      console.error('❌ [useAdminChatSocket] Error:', data);
      setError(data.message);
    });

    newSocket.on('connected', (data: { message: string }) => {
      console.log('🎉 [useAdminChatSocket] Welcome:', data.message);
    });

    // Cleanup
    return () => {
      if (conversationId) {
        newSocket.emit('leave_conversation', conversationId);
      }
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, []); // Only run once on mount

  // Join conversation when conversationId changes
  useEffect(() => {
    if (socket && conversationId && isConnected) {
      socket.emit('join_conversation', conversationId);
      return () => {
        socket.emit('leave_conversation', conversationId);
      };
    }
  }, [socket, conversationId, isConnected]);

  // Send message
  const sendMessage = useCallback(
    (content: string, attachments?: Array<{ type: 'image' | 'file'; url: string; name: string }>) => {
      if (!socket || !isConnected) {
        setError('Socket not connected');
        return;
      }

      if (!conversationId) {
        setError('No conversation selected');
        return;
      }

      socket.emit('admin_send_message', {
        conversationId,
        content,
        attachments,
      });
    },
    [socket, isConnected, conversationId]
  );

  // Typing indicators
  const startTyping = useCallback(() => {
    if (socket && conversationId && isConnected) {
      socket.emit('typing_start', { conversationId });
    }
  }, [socket, conversationId, isConnected]);

  const stopTyping = useCallback(() => {
    if (socket && conversationId && isConnected) {
      socket.emit('typing_stop', { conversationId });
    }
  }, [socket, conversationId, isConnected]);

  // Mark as read
  const markAsRead = useCallback(
    (messageId: string) => {
      if (socket && isConnected) {
        socket.emit('mark_read', { messageId });
      }
    },
    [socket, isConnected]
  );

  return {
    socket,
    isConnected,
    error,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
  };
};

