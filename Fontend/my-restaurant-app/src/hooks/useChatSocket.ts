import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';
import type { Message } from '../services/chatService';

interface UseChatSocketOptions {
  conversationId?: string;
  onMessageReceived?: (message: Message) => void;
  onTyping?: (data: { userId: string; userName: string; isTyping: boolean }) => void;
}

export const useChatSocket = (options: UseChatSocketOptions = {}) => {
  const { conversationId, onMessageReceived, onTyping } = options;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

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
      console.warn('⚠️ [useChatSocket] Warning: socketUrl still contains /api, removing...');
      socketUrl = socketUrl.replace(/\/api.*$/, '');
    }

    console.log('🔌 [useChatSocket] Connecting to:', socketUrl);
    console.log('🔌 [useChatSocket] CUSTOMER_API:', API_CONFIG.CUSTOMER_API);
    console.log('🔌 [useChatSocket] CHAT_SOCKET_URL (raw):', API_CONFIG.CHAT_SOCKET_URL);
    console.log('🔌 [useChatSocket] Final socketUrl:', socketUrl);

    const newSocket = io(socketUrl, {
      auth: {
        token,
        type: 'customer',
      },
      transports: ['websocket', 'polling'],
      path: '/socket.io/',
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection handlers
    newSocket.on('connect', () => {
      console.log('✅ [useChatSocket] Connected:', newSocket.id);
      setIsConnected(true);
      setError(null);

      // Join conversation if provided
      if (conversationId) {
        newSocket.emit('join_conversation', conversationId);
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ [useChatSocket] Connection error:', err);
      setError(err.message || 'Connection failed');
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 [useChatSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    // Message handlers
    newSocket.on('message_received', (data: Message) => {
      console.log('📨 [useChatSocket] Message received:', data);
      if (onMessageReceived) {
        onMessageReceived(data);
      }
    });

    newSocket.on('message_sent', (data: { success: boolean; messageId?: string }) => {
      console.log('✅ [useChatSocket] Message sent:', data);
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
      console.error('❌ [useChatSocket] Error:', data);
      setError(data.message);
    });

    newSocket.on('connected', (data: { message: string }) => {
      console.log('🎉 [useChatSocket] Welcome:', data.message);
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

      socket.emit('customer_send_message', {
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

