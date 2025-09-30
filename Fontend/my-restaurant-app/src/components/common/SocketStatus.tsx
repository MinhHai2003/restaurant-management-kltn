import React from 'react';
import { useSocket } from '../../hooks/useSocket';

const SocketStatus: React.FC = () => {
  const { connected, connect, disconnect } = useSocket('employee');

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: connected ? '#10b981' : '#ef4444',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'white',
        animation: connected ? 'none' : 'pulse 2s infinite'
      }} />
      <span>{connected ? 'Socket Connected' : 'Socket Disconnected'}</span>
      <button
        onClick={connected ? disconnect : connect}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        {connected ? 'Disconnect' : 'Connect'}
      </button>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `
      }} />
    </div>
  );
};

export default SocketStatus;