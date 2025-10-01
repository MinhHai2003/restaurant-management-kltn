# 🤖 Hướng dẫn sử dụng ChatBot thêm món vào giỏ hàng

## 🎯 Tính năng mới

ChatBot của nhà hàng giờ đây có thể:

- ✅ **Tìm kiếm món ăn** trong menu
- ✅ **Thêm món vào giỏ hàng** trực tiếp
- ✅ **Xem giỏ hàng** hiện tại
- ✅ **Gợi ý món ngon** theo danh mục

## 🗣️ Cách sử dụng

### 1. Tìm kiếm món ăn

```
"Tìm cơm chiên"
"Có món hải sản không?"
"Menu có gì?"
```

### 2. Thêm món vào giỏ hàng

```
"Thêm cơm chiên hải sản vào giỏ hàng"
"Đặt 2 phần lẩu thái"
"Thêm tôm sú vào giỏ"
```

### 3. Xem giỏ hàng

```
"Xem giỏ hàng"
"Tôi đã đặt món gì?"
"Giỏ hàng của tôi"
```

### 4. Gợi ý món ăn

```
"Gợi ý món ngon"
"Đề xuất món hải sản"
"Có món nước uống gì?"
```

## 🎨 Ví dụ cuộc hội thoại

**User:** "Chào bot"
**Bot:** "👋 Chào bạn! Tôi là trợ lý AI của nhà hàng Hải Sản Biển Đông..."

**User:** "Tìm cơm chiên"
**Bot:** "🍽️ Tìm thấy các món phù hợp:

1. Cơm Chiên Hải Sản - 85,000đ
2. Cơm Chiên Dương Châu - 65,000đ..."

**User:** "Thêm cơm chiên hải sản vào giỏ hàng"
**Bot:** "✅ Đã thêm 1 Cơm Chiên Hải Sản vào giỏ hàng!
💰 Thành tiền: 85,000đ"

**User:** "Xem giỏ hàng"
**Bot:** "🛒 Giỏ hàng của bạn:

1. Cơm Chiên Hải Sản x1 - 85,000đ
   💰 Tổng cộng: 85,000đ"

## ⚙️ Cách hoạt động (Technical)

### 1. Kiến trúc hệ thống

```
User Input → aiService.ts → chatbotCartService.ts → cartService.ts → Backend API
```

### 2. Files quan trọng

- `src/services/chatbotCartService.ts` - Logic xử lý giỏ hàng cho bot
- `src/services/aiService.ts` - Xử lý câu hỏi và routing
- `src/components/ChatBot/ChatBot.tsx` - UI chatbot
- `src/components/ChatBot/ChatBotContainer.tsx` - Container với cart context

### 3. API endpoints được sử dụng

- `GET /api/menu` - Lấy danh sách món ăn
- `POST /api/cart/add` - Thêm món vào giỏ hàng
- `GET /api/cart` - Xem giỏ hàng

## 🔧 Cài đặt và setup

### 1. Dependencies cần thiết

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "typescript": "^4.9.0"
  }
}
```

### 2. Environment variables

```env
# AI API Keys cho Chatbot
VITE_GROQ_API_KEY=your_groq_api_key
VITE_COHERE_API_KEY=your_cohere_api_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

### 3. Backend services cần chạy

```bash
# Menu service (port 5003)
cd Backend/menu-service && npm start

# Order service với cart (port 5005)
cd Backend/order-service && npm start

# Customer service (port 5002)
cd Backend/customer-service && npm start
```

## 🎯 Tính năng nâng cao

### 1. Nhận diện thông minh

Bot có thể hiểu các cách nói khác nhau:

- "Thêm cơm chiên" = "Đặt cơm chiên" = "Cho tôi cơm chiên"
- "2 phần" = "2 suất" = "2 đĩa"

### 2. Tự động cập nhật

Khi thêm món thành công:

- ✅ Cart count trong header tự động cập nhật
- ✅ Hiển thị thông báo thành công
- ✅ Đồng bộ với database

### 3. Error handling

- ❌ Món không tồn tại → Gợi ý món tương tự
- ❌ Chưa đăng nhập → Yêu cầu đăng nhập
- ❌ Món hết hàng → Thông báo và gợi ý khác

## 🐛 Troubleshooting

### Lỗi thường gặp:

1. **Bot không phản hồi**

   - Kiểm tra API keys trong `.env`
   - Kiểm tra backend services đang chạy

2. **Không thêm được vào giỏ hàng**

   - Kiểm tra authentication token
   - Kiểm tra order-service (port 5005)

3. **Cart count không cập nhật**
   - Kiểm tra CartContext trong ChatBotContainer
   - Kiểm tra onCartUpdate callback

### Debug mode:

```javascript
// Trong browser console
localStorage.setItem("chatbot_debug", "true");
```

## 📝 Customize

### Thêm command mới:

1. Thêm pattern matching trong `aiService.ts`
2. Tạo function xử lý trong `chatbotCartService.ts`
3. Test với các câu nói khác nhau

### Thay đổi AI responses:

1. Sửa messages trong `chatbotCartService.ts`
2. Cập nhật prompt trong `aiService.ts`

## 🚀 Kết quả

Sau khi setup xong, users có thể:

- 💬 Chat tự nhiên với bot về món ăn
- 🛒 Thêm món vào giỏ hàng không cần rời khỏi chat
- 👀 Xem giỏ hàng và tổng tiền ngay lập tức
- 🎯 Nhận gợi ý món phù hợp

**Trải nghiệm mượt mà như chat với người thật! 🎉**
