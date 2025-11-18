import React from 'react';
import type { Conversation } from '../../../services/chatService';

interface CustomerInfoProps {
  conversation: Conversation;
}

export const CustomerInfo: React.FC<CustomerInfoProps> = ({ conversation }) => {
  const customer = conversation.customerId || conversation.customerInfo;

  if (!customer || typeof customer === 'string') {
    return (
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
        }}
      >
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          Đang tải thông tin khách hàng...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px',
            fontWeight: 'bold',
          }}
        >
          {customer.avatar ? (
            <img
              src={customer.avatar}
              alt={customer.name}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            customer.name.charAt(0).toUpperCase()
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
            {customer.name}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
            {customer.email}
          </p>
          {customer.phone && (
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
              📞 {customer.phone}
            </p>
          )}
        </div>
        <div
          style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor:
              conversation.status === 'open'
                ? '#d1fae5'
                : conversation.status === 'waiting'
                ? '#fef3c7'
                : '#e5e7eb',
            color:
              conversation.status === 'open'
                ? '#065f46'
                : conversation.status === 'waiting'
                ? '#92400e'
                : '#374151',
          }}
        >
          {conversation.status === 'open'
            ? 'Đang mở'
            : conversation.status === 'waiting'
            ? 'Chờ xử lý'
            : 'Đã đóng'}
        </div>
      </div>
    </div>
  );
};

