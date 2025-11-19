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
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'warning' | 'error' } | null>(null);
  const [insertText, setInsertText] = useState<string>(''); // Text to insert into input

  const { sendMessage, startTyping, stopTyping, isConnected, error: socketError } =
    useAdminChatSocket({
      conversationId: conversation?.id || conversation?._id,
      onConversationClosed: (data) => {
        // Show notification when conversation is closed
        setNotification({
          message: 'Cuộc trò chuyện đã được đóng bởi người dùng',
          type: 'info',
        });
        // Notify parent to reload conversations
        if (onAssign) {
          onAssign();
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
            console.log('⚠️ [AdminChatWindow] Duplicate message detected, skipping:', messageId);
            return prev;
          }
          
          return [...prev, message];
        });

        // Mark as read if it's from customer (fire and forget, don't block on errors)
        if (message.senderType === 'customer' && !message.isRead) {
          chatService.markAdminMessageAsRead(message.id || message._id).catch((error) => {
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
        const response = await chatService.getAdminMessages(
          conversationId,
          { page: 1, limit: 50 }
        );

        if (response.success && response.data) {
          setMessages(response.data.messages);
          
          // Note: Mark all as read is handled in AdminChatDashboard.handleSelectConversation
          // to ensure unread count badge is cleared immediately when conversation is selected
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [conversation?.id || conversation?._id]); // Only depend on conversation ID, not the whole object

  // Auto assign conversation if not assigned
  useEffect(() => {
    if (conversation && !conversation.adminId && onAssign) {
      const conversationId = conversation.id || conversation._id;
      if (!conversationId) {
        return;
      }

      const assignConversation = async () => {
        const employeeData = localStorage.getItem('employeeData');
        if (employeeData) {
          const admin = JSON.parse(employeeData);
          await chatService.assignConversation(
            conversationId,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id || conversation?._id, conversation?.adminId]); // Only depend on conversation ID and adminId

  const handleSendMessage = async (content: string) => {
    if (!conversation) return;

    try {
      // Send via socket only - message will be added via socket event
      sendMessage(content);
      
      // Note: We don't send via API here to avoid duplicate messages
      // Socket will handle the message and emit it back via 'message_received' event
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleCloseConversation = async () => {
    if (!conversation) return;

    try {
      await chatService.closeAdminConversation(conversation.id || conversation._id);
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
        insertText={insertText}
        onInsertTextHandled={() => {
          // Clear insertText after it's been inserted
          setInsertText('');
        }}
      />

      {/* Actions */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backgroundColor: '#f9fafb',
        }}
      >
        {/* Quick Reply Buttons */}
        {conversation && (conversation.status === 'open' || conversation.status === 'waiting') && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            <button
              onClick={() => setInsertText('Xin chào! Tôi có thể giúp gì cho bạn?')}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#0ea5e9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              👋 Xin chào
            </button>
            <button
              onClick={() => setInsertText('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.')}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#0ea5e9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              🙏 Cảm ơn
            </button>
            <button
              onClick={() => setInsertText('Vui lòng cho tôi biết thêm chi tiết về vấn đề của bạn.')}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#0ea5e9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              ❓ Cần thêm thông tin
            </button>
            <button
              onClick={() => setInsertText('Vấn đề của bạn đã được giải quyết chưa?')}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#0ea5e9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              ✅ Đã giải quyết?
            </button>
            <button
              onClick={() => setInsertText('Chúng tôi đang xử lý yêu cầu của bạn, vui lòng đợi trong giây lát.')}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#0ea5e9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              ⏳ Đang xử lý
            </button>
            <button
              onClick={() => setInsertText('Chúng tôi đã nhận được thông tin của bạn và sẽ liên hệ lại sớm nhất.')}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#0ea5e9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              📝 Đã nhận thông tin
            </button>
            <button
              onClick={() => setInsertText('Vui lòng xác nhận lại thông tin để chúng tôi có thể hỗ trợ bạn tốt hơn.')}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#0ea5e9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              🔍 Cần xác nhận
            </button>
            <button
              onClick={() => setInsertText('Cảm ơn bạn đã phản hồi! Chúng tôi rất trân trọng ý kiến của bạn.')}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#0ea5e9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              💬 Cảm ơn phản hồi
            </button>
            <button
              onClick={() => setInsertText('Bạn còn cần hỗ trợ gì thêm không? Chúng tôi luôn sẵn sàng giúp đỡ!')}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#0ea5e9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              🤝 Cần hỗ trợ thêm?
            </button>
            <button
              onClick={() => setInsertText('Chúc bạn có một ngày tốt lành! Nếu cần gì thêm, đừng ngại liên hệ với chúng tôi.')}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#0ea5e9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              🌟 Chúc tốt lành
            </button>
            <button
              onClick={() => setInsertText('Chúng tôi rất xin lỗi vì sự bất tiện này. Chúng tôi sẽ cố gắng khắc phục sớm nhất.')}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#0ea5e9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              😔 Xin lỗi
            </button>
          </div>
        )}
        
        {/* Close Button */}
        <div style={{ display: 'flex', gap: '8px' }}>
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

