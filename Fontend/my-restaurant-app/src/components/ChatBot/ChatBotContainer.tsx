import React, { useState, useEffect } from 'react';
import ChatBot from './ChatBot';
import ChatButton from './ChatButton';
import { useCart } from '../../contexts/CartContext';
import { ChatWindow } from '../chat/CustomerChat/ChatWindow';
import { useAuth } from '../../hooks/useAuth';
import { chatService } from '../../services/chatService';
import type { Conversation } from '../../services/chatService';

const ChatBotContainer: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [chatType, setChatType] = useState<'bot' | 'admin' | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const { updateCartCount } = useCart();
  const { user } = useAuth();

  // Load conversation when admin chat is opened
  useEffect(() => {
    const loadConversation = async () => {
      if (chatType !== 'admin' || !user) return;

      setIsLoadingConversation(true);
      try {
        const response = await chatService.getConversations({ status: 'open' });

        if (response.success && response.data) {
          const conversations = response.data.conversations;
          if (conversations.length > 0) {
            setConversation(conversations[0]);
          } else {
            const createResponse = await chatService.createConversation();
            if (createResponse.success && createResponse.data) {
              setConversation(createResponse.data);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load conversation:', error);
      } finally {
        setIsLoadingConversation(false);
      }
    };

    loadConversation();
  }, [chatType, user]);

  const toggleChat = () => {
    if (chatType) {
      // Close current chat
      setChatType(null);
      setShowMenu(false);
    } else {
      // Show menu
      setShowMenu(!showMenu);
    }
  };

  const handleSelectChatType = (type: 'bot' | 'admin') => {
    setChatType(type);
    setShowMenu(false);
  };

  return (
    <>
      {/* Menu Selection */}
      {showMenu && !chatType && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '20px',
            width: '280px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            zIndex: 1000,
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              💬 Chọn hình thức hỗ trợ
            </h3>
            
            <button
              onClick={() => handleSelectChatType('bot')}
              style={{
                width: '100%',
                padding: '16px',
                marginBottom: '12px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: '24px' }}>🤖</span>
              <div style={{ textAlign: 'left' }}>
                <div>Trợ Lý AI</div>
                <div style={{ fontSize: '11px', opacity: 0.9 }}>Tư vấn món ăn, menu, đặt bàn</div>
              </div>
            </button>

            <button
              onClick={() => handleSelectChatType('admin')}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: '24px' }}>👨‍💼</span>
              <div style={{ textAlign: 'left' }}>
                <div>Chat với Admin</div>
                <div style={{ fontSize: '11px', opacity: 0.9 }}>Hỗ trợ trực tiếp từ nhân viên</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Chatbot AI */}
      {chatType === 'bot' && (
        <ChatBot isOpen={true} onClose={toggleChat} onCartUpdate={updateCartCount} />
      )}

      {/* Admin Chat */}
      {chatType === 'admin' && user && (
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
            zIndex: 1000,
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          {isLoadingConversation ? (
            <div
              style={{
                height: '100%',
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
              currentUserId={user._id || user.id || ''}
              onClose={toggleChat}
              onConversationCreated={setConversation}
              onConversationClosed={() => {
                // When conversation is closed, close the chat window
                setChatType(null);
                setConversation(null);
                setShowMenu(false);
              }}
            />
          )}
        </div>
      )}

      <ChatButton isOpen={chatType !== null} onClick={toggleChat} />
    </>
  );
};

export default ChatBotContainer;