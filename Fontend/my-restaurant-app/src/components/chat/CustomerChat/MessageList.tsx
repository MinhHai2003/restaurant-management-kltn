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
        padding: '16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: '#f9fafb',
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
            }}
          >
            <div
              style={{
                maxWidth: '75%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                gap: '4px',
              }}
            >
              {!isOwnMessage && (
                <span
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    fontWeight: '500',
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
                    ? 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)'
                    : isAdmin
                    ? '#e0f2fe'
                    : '#f3f4f6',
                  color: isOwnMessage ? 'white' : '#374151',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {message.content}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: '#323d4d',
                  fontWeight: '700',
                }}
              >
                <span style={{ fontWeight: '700' }}>{formatTime(message.createdAt)}</span>
                {/* Read receipt - only show for own messages */}
                {isOwnMessage && (
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#323d4d',
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
              background: '#f3f4f6',
              color: '#374151',
              fontSize: '14px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>{typingUserName || 'Admin'} đang gõ</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#6b7280',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#6b7280',
                    animation: 'pulse 1.5s ease-in-out infinite 0.2s',
                  }}
                />
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#6b7280',
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

