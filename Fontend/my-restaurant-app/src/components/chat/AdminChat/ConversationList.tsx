import React, { useState } from 'react';
import type { Conversation } from '../../../services/chatService';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  filter: 'all' | 'open' | 'waiting' | 'closed';
  onFilterChange: (filter: 'all' | 'open' | 'waiting' | 'closed') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCustomerName = (conversation: Conversation) => {
    if (typeof conversation.customerId === 'object' && conversation.customerId && 'name' in conversation.customerId) {
      return conversation.customerId.name;
    }
    if (conversation.customerInfo) {
      return conversation.customerInfo.name;
    }
    return 'Khách hàng';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return { bg: '#d1fae5', text: '#065f46' };
      case 'waiting':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'closed':
        return { bg: '#e5e7eb', text: '#374151' };
      default:
        return { bg: '#e5e7eb', text: '#374151' };
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
        }}
      >
        <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600' }}>
          Cuộc trò chuyện
        </h2>

        {/* Search */}
        <input
          type="text"
          placeholder="Tìm kiếm khách hàng..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '12px',
            outline: 'none',
          }}
        />

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['all', 'waiting', 'open', 'closed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                backgroundColor: filter === f ? '#0ea5e9' : '#e5e7eb',
                color: filter === f ? 'white' : '#374151',
                transition: 'all 0.2s',
              }}
            >
              {f === 'all'
                ? 'Tất cả'
                : f === 'waiting'
                ? 'Chờ xử lý'
                : f === 'open'
                ? 'Đang mở'
                : 'Đã đóng'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: 'white',
        }}
      >
        {conversations.length === 0 ? (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              color: '#6b7280',
            }}
          >
            Không có cuộc trò chuyện nào
          </div>
        ) : (
          conversations.map((conversation) => {
            const isSelected =
              (conversation.id || conversation._id) === selectedConversationId;
            const statusColor = getStatusColor(conversation.status);
            const customerName = getCustomerName(conversation);
            const unreadCount = conversation.unreadCount.admin;

            return (
              <div
                key={conversation.id || conversation._id}
                onClick={() => onSelectConversation(conversation)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? '#eff6ff' : 'white',
                  borderLeft: isSelected ? '3px solid #0ea5e9' : '3px solid transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#111827',
                    }}
                  >
                    {customerName}
                  </h3>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        backgroundColor: '#ef4444',
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
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: statusColor.bg,
                      color: statusColor.text,
                      fontWeight: '500',
                    }}
                  >
                    {conversation.status === 'open'
                      ? 'Đang mở'
                      : conversation.status === 'waiting'
                      ? 'Chờ xử lý'
                      : 'Đã đóng'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {formatTime(conversation.lastMessageAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

