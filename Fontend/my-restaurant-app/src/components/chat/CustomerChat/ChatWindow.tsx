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

  const { sendMessage, startTyping, stopTyping, isConnected, error: socketError } = useChatSocket({
    conversationId: conversation?.id || conversation?._id,
    onMessageReceived: (message: Message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => (m.id || m._id) === (message.id || message._id))) {
          return prev;
        }
        return [...prev, message];
      });

      // Mark as read if it's from admin
      if (message.senderType === 'admin' && !message.isRead) {
        chatService.markMessageAsRead(message.id || message._id);
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

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const response = await chatService.getMessages(
          conversation.id || conversation._id,
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
  }, [conversation]);

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
      // Send via socket (will reconnect with new conversationId)
      sendMessage(content);

      // Also send via API as backup
      const response = await chatService.sendMessage(
        currentConversation.id || currentConversation._id,
        content
      );

      if (response.success && response.data) {
        // Message will be added via socket event
        // But add it immediately for better UX
        const newMessage: Message = {
          ...response.data,
          id: response.data.id || response.data._id,
        };
        setMessages((prev) => [...prev, newMessage]);
      }
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
        disabled={!isConnected || isLoading}
        placeholder="Nhập tin nhắn của bạn..."
      />

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

