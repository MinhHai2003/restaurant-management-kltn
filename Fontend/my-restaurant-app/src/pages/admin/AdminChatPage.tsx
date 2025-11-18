import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../../config/api';

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  senderType: 'customer' | 'admin';
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  _id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  adminId?: string;
  adminName?: string;
  status: 'open' | 'waiting' | 'closed';
  lastMessageAt: string;
  unreadCount: {
    customer: number;
    admin: number;
  };
  lastMessage?: string;
}

const AdminChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'waiting' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get admin info from localStorage
  const getAdminInfo = () => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return {
        id: userData._id || userData.id,
        name: userData.name,
        role: userData.role
      };
    }
    return null;
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('employeeToken');
    if (!token) return;

    socketRef.current = io(API_CONFIG.CUSTOMER_API, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Admin socket connected:', socket.id);
      const adminInfo = getAdminInfo();
      if (adminInfo) {
        socket.emit('admin_online', { adminId: adminInfo.id, adminName: adminInfo.name });
      }
    });

    socket.on('message_received', (message: Message) => {
      console.log('📨 New message received:', message);
      
      // Update messages if viewing this conversation
      if (selectedConversation && message.conversationId === selectedConversation._id) {
        setMessages(prev => [...prev, message]);
        
        // Auto mark as read if admin is viewing
        if (message.senderType === 'customer') {
          socket.emit('admin_mark_read', {
            conversationId: message.conversationId,
            messageId: message._id
          });
        }
      }

      // Update conversation list
      fetchConversations();
    });

    socket.on('typing_indicator', ({ conversationId, isTyping: typing }) => {
      if (selectedConversation && conversationId === selectedConversation._id) {
        setIsTyping(typing);
      }
    });

    socket.on('conversation_updated', () => {
      fetchConversations();
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedConversation]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(`${API_CONFIG.CUSTOMER_API}/customers/chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setConversations(result.data.conversations || []);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(
        `${API_CONFIG.CUSTOMER_API}/customers/chat/conversations/${conversationId}/messages`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMessages(result.data.messages || []);
          
          // Join conversation room
          if (socketRef.current) {
            socketRef.current.emit('admin_join_conversation', { conversationId });
          }
          
          // Mark messages as read
          const unreadMessages = result.data.messages.filter(
            (msg: Message) => !msg.isRead && msg.senderType === 'customer'
          );
          
          if (unreadMessages.length > 0 && socketRef.current) {
            unreadMessages.forEach((msg: Message) => {
              socketRef.current?.emit('admin_mark_read', {
                conversationId,
                messageId: msg._id
              });
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Select conversation
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation._id);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !socketRef.current) return;

    const adminInfo = getAdminInfo();
    if (!adminInfo) return;

    const messageData = {
      conversationId: selectedConversation._id,
      senderId: adminInfo.id,
      senderType: 'admin' as const,
      senderName: adminInfo.name,
      content: newMessage.trim()
    };

    socketRef.current.emit('admin_send_message', messageData);
    setNewMessage('');

    // Stop typing indicator
    socketRef.current.emit('admin_typing', {
      conversationId: selectedConversation._id,
      isTyping: false
    });
  };

  // Handle typing
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!socketRef.current || !selectedConversation) return;

    // Send typing indicator
    socketRef.current.emit('admin_typing', {
      conversationId: selectedConversation._id,
      isTyping: true
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('admin_typing', {
        conversationId: selectedConversation._id,
        isTyping: false
      });
    }, 2000);
  };

  // Assign conversation to admin
  const handleAssignToMe = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('employeeToken');
      const adminInfo = getAdminInfo();
      if (!adminInfo) return;

      const response = await fetch(
        `${API_CONFIG.CUSTOMER_API}/customers/chat/conversations/${conversationId}/assign`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            adminId: adminInfo.id,
            adminName: adminInfo.name
          })
        }
      );

      if (response.ok) {
        fetchConversations();
        alert('Đã nhận xử lý cuộc trò chuyện!');
      }
    } catch (error) {
      console.error('Error assigning conversation:', error);
      alert('Có lỗi khi nhận xử lý cuộc trò chuyện!');
    }
  };

  // Close conversation
  const handleCloseConversation = async (conversationId: string) => {
    if (!confirm('Bạn có chắc muốn đóng cuộc trò chuyện này?')) return;

    try {
      const token = localStorage.getItem('employeeToken');
      const response = await fetch(
        `${API_CONFIG.CUSTOMER_API}/customers/chat/conversations/${conversationId}/close`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        fetchConversations();
        alert('Đã đóng cuộc trò chuyện!');
      }
    } catch (error) {
      console.error('Error closing conversation:', error);
      alert('Có lỗi khi đóng cuộc trò chuyện!');
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchFilter = filter === 'all' || conv.status === filter;
    const matchSearch = conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       conv.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Format date
  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return d.toLocaleDateString('vi-VN');
  };

  const formatMessageTime = (date: string) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: 'calc(100vh - 120px)', 
      backgroundColor: '#f3f4f6',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* Sidebar - Conversation List */}
      <div style={{ 
        width: '360px', 
        backgroundColor: 'white', 
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '12px'
          }}>
            💬 Quản Lý Chat
          </h2>
          
          {/* Search */}
          <input
            type="text"
            placeholder="🔍 Tìm kiếm khách hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'rgba(255,255,255,0.9)',
              outline: 'none'
            }}
          />
        </div>

        {/* Filter Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          {(['all', 'open', 'waiting', 'closed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                backgroundColor: filter === f ? '#667eea' : 'white',
                color: filter === f ? 'white' : '#6b7280',
                transition: 'all 0.2s'
              }}
            >
              {f === 'all' && 'Tất cả'}
              {f === 'open' && 'Đang mở'}
              {f === 'waiting' && 'Chờ xử lý'}
              {f === 'closed' && 'Đã đóng'}
            </button>
          ))}
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredConversations.length === 0 ? (
            <div style={{ 
              padding: '40px 20px', 
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
              <div style={{ fontSize: '14px' }}>Chưa có cuộc trò chuyện nào</div>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={conv._id}
                onClick={() => handleSelectConversation(conv)}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  backgroundColor: selectedConversation?._id === conv._id ? '#f0f9ff' : 'white',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (selectedConversation?._id !== conv._id) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedConversation?._id !== conv._id) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: '600', 
                      color: '#111827',
                      marginBottom: '4px',
                      fontSize: '14px'
                    }}>
                      {conv.customerName}
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#6b7280',
                      marginBottom: '6px'
                    }}>
                      {conv.customerEmail}
                    </div>
                    {conv.lastMessage && (
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#9ca3af',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {conv.lastMessage}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: '12px' }}>
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#9ca3af',
                      marginBottom: '4px'
                    }}>
                      {formatTime(conv.lastMessageAt)}
                    </div>
                    {conv.unreadCount.admin > 0 && (
                      <div style={{
                        display: 'inline-block',
                        minWidth: '20px',
                        height: '20px',
                        padding: '0 6px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        lineHeight: '20px',
                        textAlign: 'center'
                      }}>
                        {conv.unreadCount.admin}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Status Badge */}
                <div style={{ 
                  display: 'inline-block',
                  marginTop: '8px',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500',
                  backgroundColor: 
                    conv.status === 'open' ? '#dcfce7' :
                    conv.status === 'waiting' ? '#fef3c7' : '#e5e7eb',
                  color:
                    conv.status === 'open' ? '#166534' :
                    conv.status === 'waiting' ? '#92400e' : '#6b7280'
                }}>
                  {conv.status === 'open' && '✓ Đang mở'}
                  {conv.status === 'waiting' && '⏳ Chờ xử lý'}
                  {conv.status === 'closed' && '🔒 Đã đóng'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedConversation ? (
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: 'white'
        }}>
          {/* Chat Header */}
          <div style={{ 
            padding: '16px 24px', 
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                {selectedConversation.customerName}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                {selectedConversation.customerEmail}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {!selectedConversation.adminId && (
                <button
                  onClick={() => handleAssignToMe(selectedConversation._id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  ✋ Nhận xử lý
                </button>
              )}
              {selectedConversation.status !== 'closed' && (
                <button
                  onClick={() => handleCloseConversation(selectedConversation._id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  🔒 Đóng
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '24px',
            backgroundColor: '#f9fafb'
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                Đang tải tin nhắn...
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
                <div>Chưa có tin nhắn nào</div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    style={{
                      display: 'flex',
                      justifyContent: msg.senderType === 'admin' ? 'flex-end' : 'flex-start',
                      marginBottom: '16px'
                    }}
                  >
                    <div style={{ maxWidth: '70%' }}>
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: msg.senderType === 'admin' ? '#667eea' : 'white',
                        color: msg.senderType === 'admin' ? 'white' : '#111827',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        wordWrap: 'break-word'
                      }}>
                        {msg.senderType === 'customer' && (
                          <div style={{ 
                            fontSize: '12px', 
                            fontWeight: '600',
                            marginBottom: '4px',
                            opacity: 0.8
                          }}>
                            {msg.senderName}
                          </div>
                        )}
                        <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                          {msg.content}
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#9ca3af',
                        marginTop: '4px',
                        textAlign: msg.senderType === 'admin' ? 'right' : 'left'
                      }}>
                        {formatMessageTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
                    Khách hàng đang gõ...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          {selectedConversation.status !== 'closed' && (
            <div style={{ 
              padding: '16px 24px', 
              borderTop: '1px solid #e5e7eb',
              backgroundColor: 'white'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Nhập tin nhắn..."
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: newMessage.trim() ? '#667eea' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s'
                  }}
                >
                  Gửi 📤
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          color: '#6b7280'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
            <div style={{ fontSize: '18px', fontWeight: '500' }}>Chọn một cuộc trò chuyện</div>
            <div style={{ fontSize: '14px', marginTop: '8px' }}>
              Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChatPage;
