# Kế Hoạch Phát Triển Hệ Thống Chat Giữa Người Dùng và Admin

## 📋 Tổng Quan

Hệ thống chat cho phép khách hàng (customer) và quản trị viên (admin/manager) giao tiếp trực tiếp với nhau, hỗ trợ giải đáp thắc mắc, xử lý khiếu nại, và cung cấp dịch vụ chăm sóc khách hàng tốt hơn.

## 🎯 Mục Tiêu

1. **Giao tiếp real-time**: Chat trực tiếp giữa customer và admin
2. **Lưu trữ lịch sử**: Lưu lại toàn bộ cuộc trò chuyện để tham khảo sau
3. **Quản lý hội thoại**: Admin có thể xem danh sách các cuộc trò chuyện đang chờ xử lý
4. **Thông báo**: Thông báo khi có tin nhắn mới
5. **Trạng thái đọc**: Đánh dấu tin nhắn đã đọc/chưa đọc

## 🏗️ Kiến Trúc Hệ Thống

### Backend Services

#### 1. Tích hợp vào Customer Service
- **Vị trí**: `Backend/customer-service/`
- **Chức năng**: 
  - Quản lý tin nhắn
  - Quản lý cuộc trò chuyện (conversations)
  - Xử lý Socket.io events cho chat
  - API REST cho lịch sử chat
  - Sử dụng database hiện có của customer-service (không tạo DB mới)

#### 2. Database Schema

**Lưu ý**: Sử dụng cùng MongoDB database của customer-service, không tạo database mới.

**Conversation Model**
```javascript
{
  _id: ObjectId,
  customerId: ObjectId (ref: Customer), // Reference đến Customer model trong cùng service
  adminId: ObjectId, // Lưu ObjectId của admin từ auth-service (không ref vì khác service)
  adminName: String, // Lưu tên admin để hiển thị
  status: String, // 'open', 'closed', 'waiting'
  lastMessageAt: Date,
  unreadCount: {
    customer: Number,
    admin: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Message Model**
```javascript
{
  _id: ObjectId,
  conversationId: ObjectId (ref: Conversation),
  senderId: ObjectId, // Customer ID hoặc Admin ID
  senderType: String, // 'customer' | 'admin'
  senderName: String,
  content: String,
  isRead: Boolean,
  readAt: Date,
  attachments: [{
    type: String, // 'image', 'file'
    url: String,
    name: String
  }],
  createdAt: Date
}
```

**Lưu ý về Admin Reference**:
- Vì admin nằm trong auth-service, không thể dùng Mongoose ref trực tiếp
- Lưu adminId và adminName trong Conversation model
- Khi cần thông tin admin, có thể gọi API auth-service hoặc cache thông tin

### Frontend Components

#### 1. Customer Side
- **ChatWidget**: Widget chat ở góc màn hình (giống ChatBot hiện tại)
- **ChatWindow**: Cửa sổ chat đầy đủ
- **MessageList**: Danh sách tin nhắn
- **MessageInput**: Ô nhập tin nhắn

#### 2. Admin Side
- **AdminChatDashboard**: Trang quản lý tất cả cuộc trò chuyện
- **ConversationList**: Danh sách các cuộc trò chuyện
- **ChatWindow**: Cửa sổ chat (tương tự customer)
- **CustomerInfo**: Thông tin khách hàng trong cuộc trò chuyện

## 📦 Cấu Trúc Thư Mục

### Backend (Tích hợp vào customer-service)
```
Backend/customer-service/
├── config/
│   ├── db.js (sử dụng lại)
│   └── socket.js (mới - Socket.io config)
├── controllers/
│   ├── customerController.js (có sẵn)
│   ├── passwordResetController.js (có sẵn)
│   ├── conversationController.js (mới)
│   └── messageController.js (mới)
├── models/
│   ├── Customer.js (có sẵn)
│   ├── PasswordReset.js (có sẵn)
│   ├── Conversation.js (mới)
│   └── Message.js (mới)
├── routes/
│   ├── customerRoutes.js (có sẵn)
│   ├── emailRoutes.js (có sẵn)
│   ├── conversationRoutes.js (mới)
│   └── messageRoutes.js (mới)
├── middleware/
│   ├── authenticateCustomer.js (có sẵn - sử dụng lại)
│   ├── authenticateEmployee.js (có sẵn - sử dụng lại)
│   └── optionalAuth.js (có sẵn)
├── services/
│   ├── emailService.js (có sẵn)
│   ├── notificationService.js (có sẵn)
│   └── chatSocketService.js (mới - Socket.io handlers)
└── index.js (cập nhật để tích hợp Socket.io)
```

### Frontend
```
Fontend/my-restaurant-app/src/
├── components/
│   └── chat/
│       ├── CustomerChat/
│       │   ├── ChatWidget.tsx
│       │   ├── ChatWindow.tsx
│       │   ├── MessageList.tsx
│       │   └── MessageInput.tsx
│       └── AdminChat/
│           ├── AdminChatDashboard.tsx
│           ├── ConversationList.tsx
│           ├── ChatWindow.tsx
│           └── CustomerInfo.tsx
├── services/
│   └── chatService.ts
└── hooks/
    └── useChatSocket.ts
```

## 🔌 Socket.io Events

### Customer Events
- `customer_send_message`: Customer gửi tin nhắn
- `customer_join_conversation`: Customer tham gia cuộc trò chuyện
- `customer_mark_read`: Customer đánh dấu đã đọc

### Admin Events
- `admin_send_message`: Admin gửi tin nhắn
- `admin_join_conversation`: Admin tham gia cuộc trò chuyện
- `admin_assign_conversation`: Admin nhận xử lý cuộc trò chuyện
- `admin_close_conversation`: Admin đóng cuộc trò chuyện
- `admin_mark_read`: Admin đánh dấu đã đọc

### Server Events
- `message_received`: Tin nhắn mới được gửi đến
- `message_sent`: Xác nhận tin nhắn đã được gửi
- `conversation_updated`: Cập nhật trạng thái cuộc trò chuyện
- `typing_indicator`: Hiển thị "đang gõ..."

## 🔐 Authentication & Authorization

### Customer
- Sử dụng JWT token từ `customer-service`
- Middleware: `authenticateCustomer` (có sẵn trong customer-service)
- Chỉ có thể xem tin nhắn của chính mình

### Admin/Manager
- Sử dụng JWT token từ `auth-service`
- Middleware: `authenticateEmployee` (có sẵn trong customer-service) hoặc import từ `auth-service`
- Có thể xem tất cả cuộc trò chuyện
- Có thể assign conversation cho admin khác
- **Lưu ý**: Cần import User model từ auth-service hoặc tạo API client để verify admin token

## 📡 API Endpoints

### Conversation APIs

**GET /api/customers/chat/conversations**
- Customer: Lấy conversation của chính mình
- Admin: Lấy tất cả conversations với filter (status, date, etc.)

**GET /api/customers/chat/conversations/:id**
- Lấy chi tiết conversation

**POST /api/customers/chat/conversations**
- Customer: Tạo conversation mới
- Tự động tạo khi customer gửi tin nhắn đầu tiên

**PATCH /api/customers/chat/conversations/:id/assign**
- Admin: Assign conversation cho admin khác

**PATCH /api/customers/chat/conversations/:id/close**
- Admin: Đóng conversation

**PATCH /api/customers/chat/conversations/:id/reopen**
- Admin: Mở lại conversation đã đóng

### Message APIs

**GET /api/customers/chat/conversations/:conversationId/messages**
- Lấy danh sách tin nhắn (có pagination)

**POST /api/customers/chat/conversations/:conversationId/messages**
- Gửi tin nhắn mới

**PATCH /api/customers/chat/messages/:messageId/read**
- Đánh dấu tin nhắn đã đọc

**GET /api/customers/chat/conversations/:conversationId/unread-count**
- Lấy số tin nhắn chưa đọc

## 🎨 UI/UX Design

### Customer Chat Widget
- **Vị trí**: Góc dưới bên phải màn hình
- **Trạng thái**: 
  - Icon chat khi đóng
  - Cửa sổ chat khi mở (400x600px)
- **Features**:
  - Hiển thị số tin nhắn chưa đọc
  - Animation khi có tin nhắn mới
  - Minimize/Maximize

### Admin Chat Dashboard
- **Layout**: 2 cột
  - Cột trái: Danh sách conversations
  - Cột phải: Chat window
- **Conversation List**:
  - Sắp xếp theo thời gian tin nhắn cuối
  - Badge số tin nhắn chưa đọc
  - Màu sắc khác nhau cho status (open, waiting, closed)
  - Filter: All, Open, Waiting, Closed
  - Search theo tên customer

## 🔄 Luồng Hoạt Động

### Luồng Customer Gửi Tin Nhắn
1. Customer mở chat widget
2. Nếu chưa có conversation, tự động tạo mới
3. Customer nhập tin nhắn và gửi
4. Socket emit `customer_send_message`
5. Server lưu tin nhắn vào DB
6. Server emit `message_received` đến:
   - Customer (xác nhận)
   - Tất cả admin online (thông báo)
7. Nếu có admin đang xem conversation này, emit đến admin đó

### Luồng Admin Phản Hồi
1. Admin mở Admin Chat Dashboard
2. Admin chọn conversation từ danh sách
3. Admin join conversation (socket join room)
4. Admin nhập và gửi tin nhắn
5. Socket emit `admin_send_message`
6. Server lưu tin nhắn vào DB
7. Server emit `message_received` đến customer

### Luồng Assign Conversation
1. Admin A đang xử lý conversation
2. Admin A assign cho Admin B
3. Server cập nhật `adminId` trong conversation
4. Emit `conversation_updated` đến cả 2 admin
5. Admin B nhận thông báo có conversation mới được assign

## 📝 Implementation Steps

### Phase 1: Backend Foundation (Tuần 1)
1. ✅ Thêm Socket.io vào dependencies của customer-service
2. ✅ Tạo Conversation và Message models (trong customer-service/models)
3. ✅ Tạo conversationController và messageController
4. ✅ Tạo conversationRoutes và messageRoutes
5. ✅ Tích hợp routes vào index.js
6. ✅ Test API với Postman

### Phase 2: Socket.io Integration (Tuần 1-2)
1. ✅ Tạo config/socket.js trong customer-service
2. ✅ Tích hợp Socket.io server vào index.js (tạo HTTP server từ Express app)
3. ✅ Tạo chatSocketService.js để xử lý socket events
4. ✅ Implement socket events cho chat (customer_send_message, admin_send_message, etc.)
5. ✅ Xử lý real-time messaging
6. ✅ Implement typing indicator
7. ✅ Test real-time communication

### Phase 3: Frontend Customer Chat (Tuần 2-3)
1. ✅ Tạo ChatWidget component
2. ✅ Tạo ChatWindow component
3. ✅ Tích hợp Socket.io client
4. ✅ Implement message sending/receiving
5. ✅ UI/UX cho customer chat
6. ✅ Test với backend

### Phase 4: Frontend Admin Chat (Tuần 3-4)
1. ✅ Tạo AdminChatDashboard
2. ✅ Tạo ConversationList component
3. ✅ Implement conversation management
4. ✅ UI/UX cho admin chat
5. ✅ Test assign/close conversation

### Phase 5: Advanced Features (Tuần 4)
1. ✅ Unread message count
2. ✅ Mark as read functionality
3. ✅ Notification system
4. ✅ Search và filter conversations
5. ✅ Pagination cho messages

### Phase 6: Testing & Polish (Tuần 5)
1. ✅ Unit tests
2. ✅ Integration tests
3. ✅ UI/UX improvements
4. ✅ Performance optimization
5. ✅ Documentation

## 🧪 Testing Strategy

### Unit Tests
- Model methods
- Controller functions
- Service functions

### Integration Tests
- API endpoints
- Socket.io events
- Database operations

### E2E Tests
- Customer gửi tin nhắn → Admin nhận được
- Admin phản hồi → Customer nhận được
- Assign conversation flow
- Close conversation flow

## 🔒 Security Considerations

1. **Authentication**: Tất cả requests phải có JWT token
2. **Authorization**: 
   - Customer chỉ xem conversation của mình
   - Admin chỉ xem conversation được assign hoặc chưa có admin
3. **Input Validation**: Validate tất cả input từ client
4. **Rate Limiting**: Giới hạn số tin nhắn gửi trong 1 phút
5. **XSS Protection**: Sanitize tin nhắn trước khi lưu
6. **File Upload**: Validate file type và size

## 📊 Performance Optimization

1. **Pagination**: Load messages theo trang (20-50 messages/page)
2. **Lazy Loading**: Load messages khi scroll lên
3. **Indexing**: Index trên conversationId, customerId, adminId
4. **Caching**: Cache conversation list cho admin
5. **Socket Rooms**: Sử dụng rooms để optimize broadcasting

## 🚀 Deployment

1. **Environment Variables** (thêm vào customer-service):
   - `MONGODB_URI` (đã có)
   - `JWT_SECRET` (đã có)
   - `PORT` (đã có)
   - `CORS_ORIGIN` (đã có)
   - `AUTH_SERVICE_URL` (mới - để verify admin token)

2. **Dependencies** (thêm vào customer-service/package.json):
   - `socket.io` (mới)
   - Các dependencies khác đã có sẵn

3. **Health Check**: `/health` endpoint (đã có)

4. **Database**: 
   - Sử dụng cùng MongoDB connection hiện có
   - Models Conversation và Message sẽ được lưu trong cùng database

## 📈 Future Enhancements

1. **File Attachments**: Upload ảnh, file
2. **Voice Messages**: Gửi tin nhắn thoại
3. **Video Call**: Gọi video trực tiếp
4. **Chatbot Integration**: Tự động trả lời câu hỏi thường gặp
5. **Translation**: Dịch tin nhắn tự động
6. **Analytics**: Thống kê thời gian phản hồi, số lượng conversation
7. **Tags**: Gắn tag cho conversation (urgent, complaint, inquiry)
8. **Templates**: Tin nhắn mẫu cho admin

## 📚 Documentation

1. **API Documentation**: Swagger/OpenAPI
2. **Component Documentation**: JSDoc comments
3. **User Guide**: Hướng dẫn sử dụng cho admin
4. **Developer Guide**: Hướng dẫn setup và development

## ✅ Checklist

### Backend (customer-service)
- [ ] Thêm socket.io vào package.json
- [ ] Tạo Models (Conversation, Message)
- [ ] Tạo Controllers (conversationController, messageController)
- [ ] Tạo Routes (conversationRoutes, messageRoutes)
- [ ] Tạo config/socket.js
- [ ] Tích hợp Socket.io vào index.js
- [ ] Tạo chatSocketService.js
- [ ] Sử dụng lại authentication middleware có sẵn
- [ ] API endpoints
- [ ] Error handling
- [ ] Validation
- [ ] Tạo API client để verify admin token từ auth-service (nếu cần)

### Frontend
- [ ] Customer ChatWidget
- [ ] Customer ChatWindow
- [ ] Admin ChatDashboard
- [ ] ConversationList
- [ ] Socket integration
- [ ] API service
- [ ] Styling
- [ ] Responsive design

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance tests

### Deployment
- [ ] Environment setup
- [ ] Database migration
- [ ] Health checks
- [ ] Monitoring

---

## 🔗 Tích hợp với Auth Service

### Xác thực Admin
Vì admin nằm trong `auth-service`, cần một trong các cách sau:

**Cách 1: API Client (Khuyến nghị)**
- Tạo service để gọi API auth-service verify token
- File: `Backend/customer-service/services/authApiClient.js`
- Endpoint: `POST /api/auth/verify-token` (cần tạo trong auth-service)

**Cách 2: Shared JWT Secret**
- Sử dụng cùng JWT_SECRET cho cả 2 services
- Verify token trực tiếp trong customer-service
- File: `Backend/customer-service/middleware/authenticateEmployee.js` (có sẵn)

**Cách 3: Shared User Model**
- Copy User model vào customer-service (không khuyến nghị)

### Lấy thông tin Admin
- Khi cần thông tin admin (tên, avatar), gọi API auth-service
- Hoặc cache thông tin admin khi assign conversation

---

**Ngày tạo**: 2024
**Phiên bản**: 1.1
**Trạng thái**: Planning - Tích hợp vào customer-service

