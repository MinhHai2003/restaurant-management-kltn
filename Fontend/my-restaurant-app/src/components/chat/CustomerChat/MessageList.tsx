import React, { useEffect, useRef, useState } from 'react';
import type { Message } from '../../../services/chatService';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isTyping?: boolean;
  typingUserName?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  isTyping,
  typingUserName,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Auto-update time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const diff = currentTime.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
      }}
    >
      {messages.map((message) => {
        const isOwnMessage = message.senderId === currentUserId;
        const isAdmin = message.senderType === 'admin';

        return (
          <div
            key={message.id || message._id}
            style={{
              display: 'flex',
              justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div
              style={{
                maxWidth: '75%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                gap: '6px',
              }}
            >
              {!isOwnMessage && (
                <span
                  style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    fontWeight: '600',
                    paddingLeft: '4px',
                  }}
                >
                  {message.senderName}
                </span>
              )}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: isOwnMessage
                    ? '16px 16px 4px 16px'
                    : '16px 16px 16px 4px',
                  background: isOwnMessage
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : isAdmin
                    ? 'white'
                    : '#f3f4f6',
                  color: isOwnMessage ? 'white' : '#1f2937',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  boxShadow: isOwnMessage 
                    ? '0 4px 12px rgba(102, 126, 234, 0.3)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.08)',
                  border: isAdmin && !isOwnMessage ? '1px solid #e5e7eb' : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {message.content}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: '600',
                  paddingLeft: isOwnMessage ? '0' : '4px',
                  paddingRight: isOwnMessage ? '4px' : '0',
                }}
              >
                <span>{formatTime(message.createdAt)}</span>
                {/* Read receipt - only show for own messages */}
                {isOwnMessage && (
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: message.isRead ? '#667eea' : '#9ca3af',
                      lineHeight: '1',
                      display: 'inline-block',
                    }}
                    title={message.isRead ? 'Đã xem' : 'Đã gửi'}
                  >
                    {message.isRead ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {isTyping && (
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '16px 16px 16px 4px',
              background: 'white',
              border: '1px solid #e5e7eb',
              color: '#6b7280',
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontWeight: '500' }}>{typingUserName || 'Admin'} đang gõ</span>
              <div style={{ display: 'flex', gap: '3px' }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#667eea',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#667eea',
                    animation: 'pulse 1.5s ease-in-out infinite 0.2s',
                  }}
                />
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#667eea',
                    animation: 'pulse 1.5s ease-in-out infinite 0.4s',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

