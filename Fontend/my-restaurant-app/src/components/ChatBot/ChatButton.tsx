import React from 'react';

interface ChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
  hasNewMessage?: boolean;
}

const ChatButton: React.FC<ChatButtonProps> = ({ isOpen, onClick, hasNewMessage = false }) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: isOpen 
          ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
          : 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
        border: 'none',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px',
        zIndex: 1001,
        transition: 'all 0.3s ease',
        transform: isOpen ? 'rotate(45deg)' : 'scale(1)',
      }}
      onMouseOver={(e) => {
        if (!isOpen) {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)';
        }
      }}
      onMouseOut={(e) => {
        if (!isOpen) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        }
      }}
    >
      {isOpen ? '✕' : '💬'}
      
      {/* Notification badge */}
      {hasNewMessage && !isOpen && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: '#ef4444',
          border: '2px solid white'
        }} />
      )}
      
      {/* Pulse animation */}
      {!isOpen && (
        <div style={{
          position: 'absolute',
          top: '-4px',
          left: '-4px',
          right: '-4px',
          bottom: '-4px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
          opacity: 0.3,
          animation: 'pulse-ring 2s infinite'
        }} />
      )}
    </button>
  );
};

export default ChatButton;