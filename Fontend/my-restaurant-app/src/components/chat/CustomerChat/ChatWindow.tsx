import React, { useEffect, useState, useRef } from 'react';
import type { Message, Conversation } from '../../../services/chatService';
import { chatService } from '../../../services/chatService';
import { useChatSocket } from '../../../hooks/useChatSocket';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatWindowProps {
  conversation: Conversation | null;
  currentUserId: string;
  onClose?: () => void;
  onConversationCreated?: (conversation: Conversation | null) => void;
  onConversationClosed?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  currentUserId,
  onClose,
  onConversationCreated,
  onConversationClosed,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState<string>('');

  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'warning' | 'error' } | null>(null);
  
  // Track if we're currently sending a message to prevent loadMessages from clearing optimistic updates
  const isSendingMessageRef = useRef(false);

  const { sendMessage, startTyping, stopTyping, isConnected, error: socketError } = useChatSocket({
    conversationId: conversation?.id || conversation?._id,
    onConversationCreated: (data) => {
      // When socket creates a conversation, update state
      console.log('✨ [ChatWindow] Conversation created via socket:', data);
      if (onConversationCreated) {
        // Fetch full conversation data
        chatService.getConversationById(data.id)
          .then((response) => {
            if (response.success && response.data) {
              onConversationCreated(response.data);
            }
          })
          .catch((error) => {
            console.error('Failed to fetch conversation:', error);
          });
      }
    },
    onConversationClosed: (data) => {
      // Clear conversation state so user can start a new conversation
      if (onConversationCreated) {
        onConversationCreated(null);
      }
      // Clear messages
      setMessages([]);
      // Notify parent to close widget immediately
      if (onConversationClosed) {
        onConversationClosed();
      }
    },
    onMessageRead: (data) => {
      // Update message read status when notified via socket
      setMessages((prev) =>
        prev.map((m) =>
          (m.id || m._id) === data.messageId
            ? { ...m, isRead: data.isRead, readAt: data.readAt }
            : m
        )
      );
    },
    onMessageReceived: (message: Message) => {
      setMessages((prev) => {
        const messageId = message.id || message._id;
        
        // Check if this is replacing an optimistic message (same content, same sender, recent)
        const optimisticIndex = prev.findIndex((m) => {
          const existingId = m.id || m._id;
          // Check if it's a temp message with same content and sender
          if (existingId && existingId.toString().startsWith('temp-')) {
            return m.content === message.content && 
                   m.senderId === message.senderId &&
                   m.senderType === message.senderType;
          }
          return false;
        });
        
        if (optimisticIndex !== -1) {
          // Replace optimistic message with real one
          const newMessages = [...prev];
          newMessages[optimisticIndex] = message;
          // Clear sending flag since we received confirmation
          isSendingMessageRef.current = false;
          return newMessages;
        }
        
        // Avoid duplicates - check by ID
        const isDuplicate = prev.some((m) => {
          const existingId = m.id || m._id;
          return existingId === messageId || 
                 (existingId && messageId && existingId.toString() === messageId.toString());
        });
        
        if (isDuplicate) {
          console.log('⚠️ [ChatWindow] Duplicate message detected, skipping:', messageId);
          return prev;
        }
        
        // Clear sending flag if this is our own message (customer message)
        if (message.senderType === 'customer' && message.senderId === currentUserId) {
          isSendingMessageRef.current = false;
        }
        
        return [...prev, message];
      });

      // Mark as read if it's from admin (fire and forget, don't block on errors)
      if (message.senderType === 'admin' && !message.isRead) {
        chatService.markMessageAsRead(message.id || message._id)
          .then((response) => {
            // Update message in state when marked as read
            if (response.success && response.data) {
              const messageData = response.data;
              setMessages((prev) =>
                prev.map((m) =>
                  (m.id || m._id) === (message.id || message._id)
                    ? { ...m, isRead: true, readAt: messageData.readAt }
                    : m
                )
              );
            }
          })
          .catch((error) => {
            console.warn('Failed to mark message as read:', error);
            // Don't throw - this is not critical
          });
      }
    },
    onTyping: (data) => {
      if (data.isTyping) {
        setIsTyping(true);
        setTypingUserName(data.userName);
      } else {
        setIsTyping(false);
        setTypingUserName('');
      }
    },
  });

  // Load messages when conversation changes
  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      return;
    }

    const conversationId = conversation.id || conversation._id;
    if (!conversationId) {
      return;
    }

    // Skip loading if we're currently sending a message (to preserve optimistic updates)
    if (isSendingMessageRef.current) {
      console.log('⏭️ [ChatWindow] Skipping loadMessages - message being sent');
      return;
    }

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const response = await chatService.getMessages(
          conversationId,
          { page: 1, limit: 50 }
        );

        if (response.success && response.data && response.data.messages) {
          // Merge with optimistic messages (temp messages that haven't been confirmed yet)
          const apiMessages = response.data.messages;
          setMessages((prevMessages) => {
            const optimisticMessages = prevMessages.filter(
              (m) => (m.id || m._id)?.toString().startsWith('temp-')
            );
            
            // Combine: API messages + optimistic messages
            const allMessages = [...apiMessages];
            
            // Add optimistic messages that aren't in API response yet
            optimisticMessages.forEach((optMsg) => {
              const exists = allMessages.some(
                (apiMsg) => 
                  apiMsg.content === optMsg.content &&
                  apiMsg.senderId === optMsg.senderId &&
                  Math.abs(new Date(apiMsg.createdAt).getTime() - new Date(optMsg.createdAt).getTime()) < 5000
              );
              if (!exists) {
                allMessages.push(optMsg);
              }
            });
            
            // Sort by createdAt
            allMessages.sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            
            return allMessages;
          });
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [conversation?.id || conversation?._id]); // Only depend on conversation ID, not the whole object

  const handleSendMessage = async (content: string) => {
    let currentConversation = conversation;
    
    // Set flag early to prevent loadMessages from clearing optimistic update
    // This is especially important when creating a new conversation
    isSendingMessageRef.current = true;

    // If no conversation, try to find existing open one first
    if (!currentConversation) {
      setIsLoading(true);
      try {
        // Try to get existing OPEN conversation first
        const getResponse = await chatService.getConversations();
        if (getResponse.success && getResponse.data) {
          const conversations = getResponse.data.conversations;
          // Only find conversations that are open or waiting (not closed)
          const activeConversation = conversations.find(
            (conv) => conv.status === 'open' || conv.status === 'waiting'
          );
          if (activeConversation) {
            currentConversation = activeConversation;
          }
        }

        // If still no active conversation, create new one
        if (!currentConversation) {
          const createResponse = await chatService.createConversation();
          if (createResponse.success && createResponse.data) {
            currentConversation = createResponse.data;
            if (onConversationCreated) {
              onConversationCreated(currentConversation);
            }
            // Wait a bit for socket to join conversation room
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            throw new Error('Failed to create conversation');
          }
        } else {
          // Update conversation state if we found existing active one
          if (onConversationCreated) {
            onConversationCreated(currentConversation);
          }
          // Wait a bit for socket to join conversation room
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        console.error('Failed to create/load conversation:', error);
        isSendingMessageRef.current = false; // Clear flag on error
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    } else if (currentConversation.status === 'closed') {
      // If conversation is closed, always create a NEW conversation
      setIsLoading(true);
      try {
        const createResponse = await chatService.createConversation();
        if (createResponse.success && createResponse.data) {
          currentConversation = createResponse.data;
          if (onConversationCreated) {
            onConversationCreated(currentConversation);
          }
          // Wait a bit for socket to join conversation room
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          throw new Error('Failed to create conversation');
        }
      } catch (error) {
        console.error('Failed to create conversation:', error);
        isSendingMessageRef.current = false; // Clear flag on error
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }

    if (!currentConversation) {
      console.error('No conversation available to send message');
      isSendingMessageRef.current = false; // Clear flag on error
      return;
    }

    // Ensure we have conversationId before sending
    const conversationIdToUse = currentConversation.id || currentConversation._id;
    if (!conversationIdToUse) {
      console.error('Conversation ID is missing');
      isSendingMessageRef.current = false; // Clear flag on error
      return;
    }

    // Get customer name from localStorage
    let customerName = 'Bạn';
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        customerName = user.name || user.username || 'Bạn';
      }
    } catch (e) {
      // Ignore
    }

    // Optimistic update: Add message to UI immediately
    const tempMessageId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempMessageId,
      _id: tempMessageId,
      conversationId: conversationIdToUse,
      senderId: currentUserId,
      senderType: 'customer',
      senderName: customerName,
      content: content,
      isRead: false,
      createdAt: new Date().toISOString(),
      attachments: [],
    };
    
    setMessages((prev) => [...prev, tempMessage]);

    try {
      // Send via socket - pass conversationId explicitly to ensure it's used
      // even if hook's conversationId hasn't updated yet
      sendMessage(content, undefined, conversationIdToUse);
      
      // Note: We don't send via API here to avoid duplicate messages
      // Socket will handle the message and emit it back via 'message_received' event
      // The optimistic message will be replaced by the real one from socket
      // Flag will be cleared in onMessageReceived when we receive confirmation
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => (m.id || m._id) !== tempMessage.id));
      // Clear flag on error
      isSendingMessageRef.current = false;
    }
  };

  // Show ready-to-chat UI when no conversation OR conversation is closed
  // (user needs to start a new conversation)
  if (!conversation || conversation.status === 'closed') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: 'white',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
            color: 'white',
            padding: '16px',
            borderRadius: '16px 16px 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              💬
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                Hỗ trợ khách hàng
              </h3>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>
                Sẵn sàng trợ giúp
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Empty state - ready to chat */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            textAlign: 'center',
            color: '#6b7280',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '24px', opacity: 0.3 }}>
            💬
          </div>
          <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
            Chào mừng bạn đến với hỗ trợ khách hàng
          </div>
          <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '24px' }}>
            Nhập tin nhắn bên dưới để bắt đầu cuộc trò chuyện
          </div>
        </div>

        {/* Input - always visible, even without conversation */}
        <MessageInput
          onSend={handleSendMessage}
          onTypingStart={() => {}} // No typing when no conversation
          onTypingStop={() => {}} // No typing when no conversation
          disabled={isLoading}
          placeholder="Nhập tin nhắn của bạn để bắt đầu..."
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'white',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
          color: 'white',
          padding: '16px',
          borderRadius: '16px 16px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            💬
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
              {conversation.adminName || 'Hỗ trợ khách hàng'}
            </h3>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>
              {isConnected ? 'Đang trực tuyến' : 'Đang kết nối...'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      {isLoading ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
          }}
        >
          Đang tải tin nhắn...
        </div>
      ) : (
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          isTyping={isTyping}
          typingUserName={typingUserName}
        />
      )}

      {/* Input */}
      <MessageInput
        onSend={handleSendMessage}
        onTypingStart={startTyping}
        onTypingStop={stopTyping}
        disabled={!isConnected || isLoading}
        placeholder="Nhập tin nhắn của bạn..."
      />

      {/* Actions */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '8px',
          backgroundColor: '#f9fafb',
        }}
      >
        {conversation.status === 'open' && (
          <button
            onClick={async () => {
              try {
                const response = await chatService.closeConversation(conversation.id || conversation._id);
                if (response.success) {
                  // Clear conversation state so user can start a new conversation
                  if (onConversationCreated) {
                    onConversationCreated(null);
                  }
                  // Clear messages
                  setMessages([]);
                  // Notify parent to close widget immediately
                  if (onConversationClosed) {
                    onConversationClosed();
                  }
                }
              } catch (error) {
                console.error('Failed to close conversation:', error);
              }
            }}
            style={{
              padding: '6px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '12px',
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer',
            }}
          >
            Đóng cuộc trò chuyện
          </button>
        )}
      </div>

      {notification && (
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: notification.type === 'info' ? '#dbeafe' : notification.type === 'warning' ? '#fef3c7' : '#fee2e2',
            color: notification.type === 'info' ? '#1e40af' : notification.type === 'warning' ? '#92400e' : '#dc2626',
            fontSize: '12px',
            textAlign: 'center',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          {notification.message}
        </div>
      )}

      {socketError && (
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            fontSize: '12px',
            textAlign: 'center',
          }}
        >
          {socketError}
        </div>
      )}
    </div>
  );
};

