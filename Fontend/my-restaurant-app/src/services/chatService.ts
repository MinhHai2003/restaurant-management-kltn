import { API_CONFIG } from '../config/api';

export interface Conversation {
  id: string;
  _id: string;
  customerId: string;
  adminId?: string;
  adminName?: string;
  status: 'open' | 'closed' | 'waiting';
  lastMessageAt: string;
  unreadCount: {
    customer: number;
    admin: number;
  };
  createdAt: string;
  updatedAt: string;
  customerInfo?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
  };
}

export interface Message {
  id: string;
  _id: string;
  conversationId: string;
  senderId: string;
  senderType: 'customer' | 'admin';
  senderName: string;
  content: string;
  isRead: boolean;
  readAt?: string;
  attachments?: Array<{
    type: 'image' | 'file';
    url: string;
    name: string;
  }>;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ChatService {
  private getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Get all conversations
  async getConversations(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ conversations: Conversation[]; pagination: any }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await fetch(
        `${API_CONFIG.CUSTOMER_API}/customers/chat/conversations?${queryParams}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get conversations');
      }

      return data;
    } catch (error) {
      console.error('Get conversations error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get conversations',
      };
    }
  }

  // Get single conversation
  async getConversationById(id: string): Promise<ApiResponse<Conversation>> {
    try {
      const response = await fetch(
        `${API_CONFIG.CUSTOMER_API}/customers/chat/conversations/${id}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get conversation');
      }

      return data;
    } catch (error) {
      console.error('Get conversation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get conversation',
      };
    }
  }

  // Create new conversation
  async createConversation(): Promise<ApiResponse<Conversation>> {
    try {
      const response = await fetch(
        `${API_CONFIG.CUSTOMER_API}/customers/chat/conversations`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create conversation');
      }

      return data;
    } catch (error) {
      console.error('Create conversation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create conversation',
      };
    }
  }

  // Get messages for a conversation
  async getMessages(
    conversationId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ApiResponse<{ messages: Message[]; pagination: any }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await fetch(
        `${API_CONFIG.CUSTOMER_API}/customers/chat/conversations/${conversationId}/messages?${queryParams}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get messages');
      }

      return data;
    } catch (error) {
      console.error('Get messages error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get messages',
      };
    }
  }

  // Send a message
  async sendMessage(
    conversationId: string,
    content: string,
    attachments?: Array<{ type: 'image' | 'file'; url: string; name: string }>
  ): Promise<ApiResponse<Message>> {
    try {
      const response = await fetch(
        `${API_CONFIG.CUSTOMER_API}/customers/chat/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ content, attachments }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      return data;
    } catch (error) {
      console.error('Send message error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      };
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId: string): Promise<ApiResponse<Message>> {
    try {
      const response = await fetch(
        `${API_CONFIG.CUSTOMER_API}/customers/chat/messages/${messageId}/read`,
        {
          method: 'PATCH',
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark message as read');
      }

      return data;
    } catch (error) {
      console.error('Mark message as read error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark message as read',
      };
    }
  }

  // Mark all messages as read
  async markAllAsRead(conversationId: string): Promise<ApiResponse<{ updatedCount: number }>> {
    try {
      const response = await fetch(
        `${API_CONFIG.CUSTOMER_API}/customers/chat/conversations/${conversationId}/messages/read-all`,
        {
          method: 'PATCH',
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark all as read');
      }

      return data;
    } catch (error) {
      console.error('Mark all as read error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark all as read',
      };
    }
  }

  // Get unread count
  async getUnreadCount(conversationId: string): Promise<ApiResponse<{ unreadCount: number }>> {
    try {
      const response = await fetch(
        `${API_CONFIG.CUSTOMER_API}/customers/chat/conversations/${conversationId}/unread-count`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get unread count');
      }

      return data;
    } catch (error) {
      console.error('Get unread count error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get unread count',
      };
    }
  }
}

export const chatService = new ChatService();

