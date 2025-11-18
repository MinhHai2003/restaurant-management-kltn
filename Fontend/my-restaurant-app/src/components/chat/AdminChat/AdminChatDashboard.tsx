import React, { useState, useEffect, useCallback } from 'react';
import type { Conversation } from '../../../services/chatService';
import { chatService } from '../../../services/chatService';
import { ConversationList } from './ConversationList';
import { AdminChatWindow } from './AdminChatWindow';
import { useAdminChatSocket } from '../../../hooks/useAdminChatSocket';

export const AdminChatDashboard: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'waiting' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentAdminId, setCurrentAdminId] = useState('');
  const [currentAdminName, setCurrentAdminName] = useState('');

  // Get current admin info
  useEffect(() => {
    const employeeData = localStorage.getItem('employeeData');
    if (employeeData) {
      const admin = JSON.parse(employeeData);
      setCurrentAdminId(admin._id || admin.id || '');
      setCurrentAdminName(admin.name || 'Admin');
    }
  }, []);

  // Setup socket for new conversation notifications
  useAdminChatSocket({
    onNewConversation: (data) => {
      console.log('New conversation notification:', data);
      // Reload conversations
      loadConversations();
    },
  });

  // Load conversations
  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: 1,
        limit: 50,
      };

      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await chatService.getAdminConversations(params);

      if (response.success && response.data) {
        let filteredConversations = response.data.conversations;

        // Apply search filter
        if (searchQuery.trim()) {
          filteredConversations = filteredConversations.filter((conv) => {
            const customerName =
              typeof conv.customerId === 'object' && conv.customerId
                ? conv.customerId.name
                : conv.customerInfo?.name || 'Khách hàng';
            return customerName.toLowerCase().includes(searchQuery.toLowerCase());
          });
        }

        setConversations(filteredConversations);

        // Auto-select first conversation if none selected
        if (!selectedConversation && filteredConversations.length > 0) {
          setSelectedConversation(filteredConversations[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, searchQuery, selectedConversation]);

  useEffect(() => {
    loadConversations();
  }, [filter]);

  // Reload when search changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversations();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Poll for new conversations
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [loadConversations]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleConversationUpdated = () => {
    loadConversations();
  };

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 200px)',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
      }}
    >
      {/* Conversation List */}
      <div style={{ width: '350px', flexShrink: 0 }}>
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversation?.id || selectedConversation?._id}
          onSelectConversation={handleSelectConversation}
          filter={filter}
          onFilterChange={setFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Chat Window */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {isLoading && conversations.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
            }}
          >
            Đang tải cuộc trò chuyện...
          </div>
        ) : (
          <AdminChatWindow
            conversation={selectedConversation}
            currentAdminId={currentAdminId}
            currentAdminName={currentAdminName}
            onAssign={handleConversationUpdated}
            onClose={handleConversationUpdated}
          />
        )}
      </div>
    </div>
  );
};

