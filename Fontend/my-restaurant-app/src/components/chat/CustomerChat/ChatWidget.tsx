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

  // Only check for unread count when widget is closed (lightweight check)
  // Don't load conversation until user actually wants to chat
  useEffect(() => {
    if (isOpen || conversation) return; // Skip if open or already has conversation

    // Lightweight check for unread messages (only when closed)
    const checkUnreadCount = async () => {
      try {
        const response = await chatService.getConversations();
        if (response.success && response.data) {
          const conversations = response.data.conversations;
          const activeConversation = conversations.find(
            (conv) => conv.status === 'open' || conv.status === 'waiting'
          );
          
          if (activeConversation) {
            const unreadResponse = await chatService.getUnreadCount(
              activeConversation.id || activeConversation._id
            );
            if (unreadResponse.success && unreadResponse.data) {
              setUnreadCount(unreadResponse.data.unreadCount);
            }
          }
        }
      } catch (error) {
        // Silently fail - don't show errors for background checks
        console.debug('Background unread check failed:', error);
      }
    };

    // Check every 30 seconds when closed
    const interval = setInterval(checkUnreadCount, 30000);
    checkUnreadCount(); // Check immediately

    return () => clearInterval(interval);
  }, [isOpen, conversation]);

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
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    // When opening widget, check if current conversation is closed
    // If closed, clear it so user can start fresh
    if (newIsOpen && conversation && conversation.status === 'closed') {
      setConversation(null);
    }
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
          <ChatWindow
            conversation={conversation}
            currentUserId={currentUserId}
            onClose={handleToggle}
            onConversationCreated={setConversation}
            onConversationClosed={() => {
              // When conversation is closed, close the widget
              setConversation(null);
              setIsOpen(false);
            }}
          />
        </div>
      )}
    </>
  );
};

