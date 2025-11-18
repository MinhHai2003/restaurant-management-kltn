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

  // Setup socket for new conversation notifications and conversation closed
  useAdminChatSocket({
    onNewConversation: (data) => {
      console.log('New conversation notification:', data);
      // Reload conversations
      loadConversations();
    },
    onConversationClosed: (data) => {
      console.log('Conversation closed notification:', data);
      // Update conversation status in list
      setConversations((prev) =>
        prev.map((conv) =>
          (conv.id || conv._id) === data.conversationId
            ? { ...conv, status: 'closed' as const }
            : conv
        )
      );
      // If current selected conversation was closed, update it
      if (selectedConversation && (selectedConversation.id || selectedConversation._id) === data.conversationId) {
        setSelectedConversation({ ...selectedConversation, status: 'closed' as const });
      }
      // Reload conversations to ensure data is in sync
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

      console.log('📋 [AdminChatDashboard] Loading conversations with params:', params);
      const response = await chatService.getAdminConversations(params);
      console.log('📋 [AdminChatDashboard] Response:', response);

      if (response.success && response.data) {
        let filteredConversations = response.data.conversations;
        console.log('📋 [AdminChatDashboard] Loaded conversations:', filteredConversations.length);

        // Apply search filter
        if (searchQuery.trim()) {
          filteredConversations = filteredConversations.filter((conv) => {
            let customerName = 'Khách hàng';
            if (typeof conv.customerId === 'object' && conv.customerId && 'name' in conv.customerId) {
              customerName = conv.customerId.name;
            } else if (conv.customerInfo) {
              customerName = conv.customerInfo.name;
            }
            return customerName.toLowerCase().includes(searchQuery.toLowerCase());
          });
        }

        setConversations(filteredConversations);

        // Auto-select first conversation if none selected
        setSelectedConversation((prev) => {
          if (!prev && filteredConversations.length > 0) {
            return filteredConversations[0];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, searchQuery]); // Removed selectedConversation to avoid infinite loop

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

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // Mark all messages as read when admin selects conversation
    // This will clear the unread count badge immediately
    if (conversation.unreadCount?.admin > 0) {
      try {
        await chatService.markAdminAllAsRead(conversation.id || conversation._id);
        
        // Update local state immediately to clear badge without waiting for reload
        setConversations((prev) =>
          prev.map((conv) =>
            (conv.id || conv._id) === (conversation.id || conversation._id)
              ? { ...conv, unreadCount: { ...conv.unreadCount, admin: 0 } }
              : conv
          )
        );
        
        // Also reload conversations to ensure data is in sync with server
        loadConversations();
      } catch (error) {
        console.warn('Failed to mark all as read:', error);
        // Don't block - continue anyway
      }
    }
  };

  const handleConversationUpdated = useCallback(() => {
    loadConversations();
  }, [loadConversations]);

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

