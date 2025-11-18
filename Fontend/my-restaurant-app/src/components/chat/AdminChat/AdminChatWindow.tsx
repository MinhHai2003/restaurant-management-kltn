import React, { useEffect, useState } from 'react';
import type { Message, Conversation } from '../../../services/chatService';
import { chatService } from '../../../services/chatService';
import { useAdminChatSocket } from '../../../hooks/useAdminChatSocket';
import { MessageList } from '../CustomerChat/MessageList';
import { MessageInput } from '../CustomerChat/MessageInput';
import { CustomerInfo } from './CustomerInfo';

interface AdminChatWindowProps {
  conversation: Conversation | null;
  currentAdminId: string;
  currentAdminName: string;
  onAssign?: () => void;
  onClose?: () => void;
}

export const AdminChatWindow: React.FC<AdminChatWindowProps> = ({
  conversation,
  currentAdminId,
  currentAdminName,
  onAssign,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState<string>('');

  const { sendMessage, startTyping, stopTyping, isConnected, error: socketError } =
    useAdminChatSocket({
      conversationId: conversation?.id || conversation?._id,
      onMessageReceived: (message: Message) => {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => (m.id || m._id) === (message.id || message._id))) {
            return prev;
          }
          return [...prev, message];
        });

        // Mark as read if it's from customer
        if (message.senderType === 'customer' && !message.isRead) {
          chatService.markAdminMessageAsRead(message.id || message._id);
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
        const response = await chatService.getAdminMessages(
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

  // Auto assign conversation if not assigned
  useEffect(() => {
    if (conversation && !conversation.adminId && onAssign) {
      const assignConversation = async () => {
        const employeeData = localStorage.getItem('employeeData');
        if (employeeData) {
          const admin = JSON.parse(employeeData);
          await chatService.assignConversation(
            conversation.id || conversation._id,
            admin._id || admin.id,
            admin.name
          );
          if (onAssign) {
            onAssign();
          }
        }
      };
      assignConversation();
    }
  }, [conversation, onAssign]);

  const handleSendMessage = async (content: string) => {
    if (!conversation) return;

    try {
      // Send via socket
      sendMessage(content);

      // Also send via API as backup
      const response = await chatService.sendAdminMessage(
        conversation.id || conversation._id,
        content
      );

      if (response.success && response.data) {
        // Message will be added via socket event
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

  const handleCloseConversation = async () => {
    if (!conversation) return;

    try {
      await chatService.closeConversation(conversation.id || conversation._id);
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to close conversation:', error);
    }
  };

  if (!conversation) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#6b7280',
          backgroundColor: '#f9fafb',
        }}
      >
        Chọn một cuộc trò chuyện để bắt đầu
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
      {/* Customer Info */}
      <CustomerInfo conversation={conversation} />

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
          currentUserId={currentAdminId}
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
        placeholder="Nhập tin nhắn..."
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
            onClick={handleCloseConversation}
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
          <button
            onClick={async () => {
              await chatService.reopenConversation(conversation.id || conversation._id);
              if (onAssign) {
                onAssign();
              }
            }}
            style={{
              padding: '6px 12px',
              border: '1px solid #0ea5e9',
              borderRadius: '6px',
              fontSize: '12px',
              backgroundColor: '#0ea5e9',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Mở lại cuộc trò chuyện
          </button>
        )}
      </div>

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

