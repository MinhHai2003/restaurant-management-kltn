import React, { useEffect, useState } from 'react';
import type { Message, Conversation } from '../../../services/chatService';
import { chatService } from '../../../services/chatService';
import { useChatSocket } from '../../../hooks/useChatSocket';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatWindowProps {
  conversation: Conversation | null;
  currentUserId: string;
  onClose?: () => void;
  onConversationCreated?: (conversation: Conversation) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  currentUserId,
  onClose,
  onConversationCreated,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState<string>('');

  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'warning' | 'error' } | null>(null);

  const { sendMessage, startTyping, stopTyping, isConnected, error: socketError } = useChatSocket({
    conversationId: conversation?.id || conversation?._id,
    onConversationClosed: (data) => {
      // Show notification when conversation is closed
      setNotification({
        message: `Cuộc trò chuyện đã được đóng bởi ${data.closedByName}`,
        type: 'info',
      });
      // Update conversation status
      if (onConversationCreated) {
        onConversationCreated({ ...conversation, status: 'closed' } as Conversation);
      }
      // Hide notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
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
        // Avoid duplicates - check by ID and also by content + timestamp to catch edge cases
        const messageId = message.id || message._id;
        const isDuplicate = prev.some((m) => {
          const existingId = m.id || m._id;
          return existingId === messageId || 
                 (existingId && messageId && existingId.toString() === messageId.toString());
        });
        
        if (isDuplicate) {
          console.log('⚠️ [ChatWindow] Duplicate message detected, skipping:', messageId);
          return prev;
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

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const response = await chatService.getMessages(
          conversationId,
          { page: 1, limit: 50 }
        );

        if (response.success && response.data) {
          setMessages(response.data.messages);
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

    // If no conversation, create one first
    if (!currentConversation) {
      setIsLoading(true);
      try {
        // Try to get existing conversation first
        const getResponse = await chatService.getConversations();
        if (getResponse.success && getResponse.data) {
          const conversations = getResponse.data.conversations;
          const activeConversation = conversations.find(
            (conv) => conv.status === 'open' || conv.status === 'waiting'
          );
          if (activeConversation) {
            currentConversation = activeConversation;
          }
        }

        // If still no conversation, create new one
        if (!currentConversation) {
          const createResponse = await chatService.createConversation();
          if (createResponse.success && createResponse.data) {
            currentConversation = createResponse.data;
            if (onConversationCreated) {
              onConversationCreated(currentConversation);
            }
          } else {
            throw new Error('Failed to create conversation');
          }
        } else {
          // Update conversation state if we found existing one
          if (onConversationCreated) {
            onConversationCreated(currentConversation);
          }
        }
      } catch (error) {
        console.error('Failed to create/load conversation:', error);
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }

    if (!currentConversation) return;

    try {
      // Send via socket only - message will be added via socket event
      sendMessage(content);
      
      // Note: We don't send via API here to avoid duplicate messages
      // Socket will handle the message and emit it back via 'message_received' event
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Show ready-to-chat UI when no conversation (user hasn't sent first message yet)
  if (!conversation) {
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
        disabled={!isConnected || isLoading || conversation?.status === 'closed'}
        placeholder={conversation?.status === 'closed' ? 'Cuộc trò chuyện đã đóng' : 'Nhập tin nhắn của bạn...'}
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
                if (response.success && response.data) {
                  // Update conversation with latest data from server
                  if (onConversationCreated) {
                    onConversationCreated(response.data);
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
        {conversation.status === 'closed' && (
          <div
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              color: '#6b7280',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
            }}
          >
            Cuộc trò chuyện đã đóng
          </div>
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

