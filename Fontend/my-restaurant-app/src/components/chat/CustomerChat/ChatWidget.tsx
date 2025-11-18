import React, { useState, useEffect } from 'react';
import { ChatWindow } from './ChatWindow';
import type { Conversation } from '../../../services/chatService';
import { chatService } from '../../../services/chatService';

interface ChatWidgetProps {
  currentUserId: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ currentUserId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Load or create conversation - automatically for customer
  useEffect(() => {
    const loadConversation = async () => {
      if (!isOpen) return;

      setIsLoading(true);
      try {
        // Try to get existing open or waiting conversation first
        const response = await chatService.getConversations();

        if (response.success && response.data) {
          const conversations = response.data.conversations;
          // Find open or waiting conversation (customer only has one active conversation)
          const activeConversation = conversations.find(
            (conv) => conv.status === 'open' || conv.status === 'waiting'
          );
          
          if (activeConversation) {
            // Use existing conversation
            setConversation(activeConversation);

            // Get unread count
            const unreadResponse = await chatService.getUnreadCount(
              activeConversation.id || activeConversation._id
            );
            if (unreadResponse.success && unreadResponse.data) {
              setUnreadCount(unreadResponse.data.unreadCount);
            }
          } else {
            // No active conversation, create new one automatically
            const createResponse = await chatService.createConversation();
            if (createResponse.success && createResponse.data) {
              setConversation(createResponse.data);
              setUnreadCount(0);
            }
          }
        } else {
          // If getConversations fails, try to create new conversation
          const createResponse = await chatService.createConversation();
          if (createResponse.success && createResponse.data) {
            setConversation(createResponse.data);
            setUnreadCount(0);
          }
        }
      } catch (error) {
        console.error('Failed to load conversation:', error);
        // Try to create new conversation as fallback
        try {
          const createResponse = await chatService.createConversation();
          if (createResponse.success && createResponse.data) {
            setConversation(createResponse.data);
            setUnreadCount(0);
          }
        } catch (createError) {
          console.error('Failed to create conversation:', createError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadConversation();
    }
  }, [isOpen]);

  // Poll for unread count when closed
  useEffect(() => {
    if (isOpen || !conversation) return;

    const interval = setInterval(async () => {
      try {
        const response = await chatService.getUnreadCount(
          conversation.id || conversation._id
        );
        if (response.success && response.data) {
          setUnreadCount(response.data.unreadCount);
        }
      } catch (error) {
        console.error('Failed to get unread count:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isOpen, conversation]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={handleToggle}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(14, 165, 233, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        💬
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '20px',
            width: '400px',
            height: '600px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001,
            border: '1px solid #e5e7eb',
          }}
        >
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
              Đang tải...
            </div>
          ) : (
            <ChatWindow
              conversation={conversation}
              currentUserId={currentUserId}
              onClose={handleToggle}
            />
          )}
        </div>
      )}
    </>
  );
};

