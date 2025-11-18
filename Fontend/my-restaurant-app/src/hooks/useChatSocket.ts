import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';
import type { Message } from '../services/chatService';

interface UseChatSocketOptions {
      conversationId?: string;
      onMessageReceived?: (message: Message) => void;
      onTyping?: (data: { userId: string; userName: string; isTyping: boolean }) => void;
      onMessageRead?: (data: { messageId: string; isRead: boolean; readAt?: string }) => void;
      onConversationClosed?: (data: { conversationId: string; closedBy: string; closedByName: string }) => void;
      onConversationCreated?: (data: { id: string; status: string }) => void;
    }

export const useChatSocket = (options: UseChatSocketOptions = {}) => {
  const { conversationId, onMessageReceived, onTyping, onMessageRead, onConversationClosed, onConversationCreated } = options;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  // Use refs to always use latest callbacks
  const onMessageReceivedRef = useRef(onMessageReceived);
  const onTypingRef = useRef(onTyping);
  const onMessageReadRef = useRef(onMessageRead);
  const onConversationClosedRef = useRef(onConversationClosed);
  const onConversationCreatedRef = useRef(onConversationCreated);
  
  // Update refs when callbacks change
  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
    onTypingRef.current = onTyping;
    onMessageReadRef.current = onMessageRead;
    onConversationClosedRef.current = onConversationClosed;
    onConversationCreatedRef.current = onConversationCreated;
  }, [onMessageReceived, onTyping, onMessageRead, onConversationClosed, onConversationCreated]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setError('No authentication token found');
      return;
    }

    // Don't connect if no conversationId - wait until user sends first message
    if (!conversationId) {
      console.log('🔌 [useChatSocket] No conversationId, skipping connection');
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

    // Message handlers - use refs to always get latest callbacks
    newSocket.on('message_received', (data: Message) => {
      console.log('📨 [useChatSocket] Message received:', data);
      if (onMessageReceivedRef.current) {
        onMessageReceivedRef.current(data);
      }
    });

    newSocket.on('message_sent', (data: { success: boolean; messageId?: string; conversationId?: string; conversationCreated?: boolean; conversationStatus?: string }) => {
      console.log('✅ [useChatSocket] Message sent:', data);
      // If conversation was just created, notify parent
      if (data.conversationCreated && data.conversationId && onConversationCreatedRef.current) {
        onConversationCreatedRef.current({
          id: data.conversationId,
          status: data.conversationStatus || 'waiting',
        });
      }
    });

    newSocket.on('message_read', (data: { messageId: string; isRead: boolean; readAt?: string }) => {
      console.log('✓✓ [useChatSocket] Message read:', data);
      if (onMessageReadRef.current) {
        onMessageReadRef.current(data);
      }
    });

    newSocket.on('conversation_closed', (data: { conversationId: string; closedBy: string; closedByName: string }) => {
      console.log('🔒 [useChatSocket] Conversation closed:', data);
      if (onConversationClosedRef.current) {
        onConversationClosedRef.current(data);
      }
    });

    newSocket.on('conversation_created', (data: { id: string; status: string }) => {
      console.log('✨ [useChatSocket] Conversation created:', data);
      if (onConversationCreatedRef.current) {
        onConversationCreatedRef.current(data);
      }
    });

    newSocket.on('typing_indicator', (data: {
      userId: string;
      userName: string;
      userType: string;
      isTyping: boolean;
    }) => {
      if (onTypingRef.current) {
        onTypingRef.current({
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
  // Use ref to track current conversation to avoid duplicate joins
  const currentConversationIdRef = useRef<string | undefined>(undefined);
  
  useEffect(() => {
    if (socket && conversationId && isConnected) {
      // Only join if conversationId actually changed
      if (currentConversationIdRef.current !== conversationId) {
        // Leave previous conversation if exists
        if (currentConversationIdRef.current) {
          socket.emit('leave_conversation', currentConversationIdRef.current);
        }
        // Join new conversation
        socket.emit('join_conversation', conversationId);
        currentConversationIdRef.current = conversationId;
        console.log('🔌 [useChatSocket] Joined conversation:', conversationId);
      }
      return () => {
        if (currentConversationIdRef.current) {
          socket.emit('leave_conversation', currentConversationIdRef.current);
          currentConversationIdRef.current = undefined;
        }
      };
    }
  }, [socket, conversationId, isConnected]);

  // Send message
  const sendMessage = useCallback(
    (content: string, attachments?: Array<{ type: 'image' | 'file'; url: string; name: string }>, overrideConversationId?: string) => {
      if (!socket || !isConnected) {
        setError('Socket not connected');
        return;
      }

      const idToUse = overrideConversationId || conversationId;
      if (!idToUse) {
        setError('No conversation selected');
        return;
      }

      socket.emit('customer_send_message', {
        conversationId: idToUse,
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

