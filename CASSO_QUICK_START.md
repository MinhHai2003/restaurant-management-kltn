# 🚀 Hướng dẫn sử dụng Casso.vn - Quick Start

## ✅ Đã hoàn thành:

1. ✅ QR code hiển thị thành công với VietinBank (ICB)
2. ✅ Component CassoPayment đã được tích hợp vào CheckoutPage
3. ✅ Thông tin ngân hàng: **106875077043** - **VONG VINH LOI**
4. ✅ Auto-check payment status mỗi 5 giây

## 📋 Các bước tiếp theo:

### Bước 1: Cấu hình Backend (BẮT BUỘC)

```bash
cd Backend/order-service

# Thêm API key vào .env
echo "CASSO_API_KEY=AK_CS.124c5120a1fb11f0b3608384b1ba5c12.9xXLQwjbFpy4xvfvUUwdPYEDdLJVGmRsKLOXyiBBoa2agOY0RhRQWvTe8pobjIxFqTiqHEeC" >> .env

# ⚠️ WEBHOOK TOKEN - BẠN TỰ TẠO (bất kỳ chuỗi nào cũng được)
# Ví dụ: kltn_restaurant_webhook_2024
# Hoặc: my_super_secret_token_123456
echo "CASSO_WEBHOOK_TOKEN=kltn_restaurant_webhook_secret_2024" >> .env

# Khởi động service
npm run dev
```

**📝 Lưu ý quan trọng về WEBHOOK TOKEN:**
- ✅ Đây là token BẠN TỰ TẠO (không lấy từ Casso)
- ✅ Có thể là bất kỳ chuỗi nào (tên dự án, ngày tháng, random...)
- ✅ Phải giữ bí mật, không public lên Github
- ⚠️ Phải nhập CHÍNH XÁC cùng token này vào Casso.vn (bước 4)

### Bước 2: Liên kết tài khoản ngân hàng trên Casso.vn

1. Đăng nhập: https://app.casso.vn
2. Vào **Tài khoản ngân hàng** → **Thêm tài khoản**
3. Chọn **VietinBank**
4. Nhập số tài khoản: **106875077043**
5. Xác thực qua OTP
6. ✅ Hoàn tất!

### Bước 3: Cấu hình Webhook (Cho Development)

**Option A: Sử dụng ngrok (Recommended)**

```bash
# Cài ngrok
npm install -g ngrok

# Expose port 5005
ngrok http 5005

# Copy URL: https://abc123.ngrok.io
```

**Option B: Sử dụng Cloudflare Tunnel**

```bash
npm install -g cloudflared
cloudflared tunnel --url http://localhost:5005
```

### Bước 4: Cấu hình Webhook trên Casso.vn

1. Vào **Cài đặt** → **Webhook**
2. **Webhook URL**: `https://YOUR-NGROK-URL.ngrok.io/api/casso/webhook`
3. **Secure Token**: `kltn_restaurant_webhook_secret_2024` 
   ⚠️ **PHẢI GIỐNG 100%** với token trong file `.env`!
4. **Sự kiện**: Chọn "Giao dịch mới"
5. Nhấn **Lưu**

**Hình minh họa cấu hình Webhook:**

```
┌─────────────────────────────────────────────┐
│ Casso.vn - Cấu hình Webhook                 │
├─────────────────────────────────────────────┤
│ Webhook URL:                                │
│ https://abc123.ngrok.io/api/casso/webhook   │
│                                             │
│ Secure Token: (⚠️ TỰ TẠO - PHẢI KHỚP .env) │
│ kltn_restaurant_webhook_secret_2024         │
│                                             │
│ Sự kiện: ☑ Giao dịch mới                   │
│                                             │
│ [Lưu]                                       │
└─────────────────────────────────────────────┘
```

### Bước 5: Test

#### Test Backend:

```bash
cd Backend/order-service

# Test webhook
node test-casso-webhook.js webhook

# Test payment instructions
node test-casso-webhook.js instructions DH123456

# Test tất cả
node test-casso-webhook.js all
```

#### Test Frontend:

1. Mở web: http://localhost:5173
2. Thêm sản phẩm vào giỏ hàng
3. Vào **Checkout**
4. Chọn **Chuyển khoản ngân hàng**
5. Tạo đơn hàng
6. **QR code sẽ hiển thị** với thông tin VietinBank

#### Test thanh toán thực:

1. **Quét QR bằng app VietinBank**
2. **Chuyển khoản** với nội dung chính xác
3. **Đợi 5-30 giây**
4. Hệ thống tự động xác nhận!

## 🎯 Flow hoàn chỉnh:

```
Customer tạo đơn hàng
    ↓
Chọn "Chuyển khoản ngân hàng"
    ↓
CassoPayment component hiển thị QR
    ↓
Customer quét QR và chuyển khoản
    ↓
VietinBank → Casso.vn
    ↓
Casso webhook → Backend (http://localhost:5005/api/casso/webhook)
    ↓
Backend tự động đối chiếu order
    ↓
Update order status = "paid"
    ↓
Socket.io notify Customer & Staff
    ↓
Frontend auto-check (mỗi 5s) → Hiển thị "Thanh toán thành công!"
    ↓
Redirect về trang Orders
```

## 📊 Monitoring

### Check logs Backend:

```bash
# Server logs
cd Backend/order-service
npm run dev

# Logs sẽ hiển thị:
🔔 [CASSO WEBHOOK] Received webhook
✅ [CASSO] Transaction saved to database
✅ [CASSO] Payment confirmed for order DH123456
```

### Check logs Frontend:

Mở **Developer Console** (F12):

```
🔍 [Casso Payment] Fetching payment instructions...
✅ [Casso Payment] Payment instructions loaded
🔄 [Casso Payment] Checking payment status...
✅ [Casso Payment] Payment confirmed!
```

## ⚠️ Troubleshooting

### QR không hiển thị

**Nguyên nhân**: URL không đúng hoặc ngân hàng không được hỗ trợ

**Giải pháp**:
```
Test URL trực tiếp:
https://img.vietqr.io/image/ICB-106875077043-compact2.jpg?amount=10000&addInfo=TEST
```

### Webhook không nhận được

**Nguyên nhân**: Ngrok chưa chạy hoặc URL webhook sai

**Giải pháp**:
1. Kiểm tra ngrok còn chạy: `http://localhost:4040`
2. Kiểm tra webhook URL trên Casso
3. Test manual: `curl -X POST https://your-ngrok.ngrok.io/api/casso/webhook ...`

### Payment status không tự động cập nhật

**Nguyên nhân**: 
- Order chưa được tạo
- Payment method không phải "banking"
- Số tiền không khớp
- Nội dung chuyển khoản sai

**Giải pháp**:
1. Check order trong database
2. Verify payment method = "banking"
3. Check số tiền trong transaction
4. Xem logs backend

## 📱 App Banking Tips

### VietinBank App:

1. Mở app → **Chuyển tiền**
2. Chọn **Quét mã QR**
3. Quét QR từ web
4. Kiểm tra:
   - Số TK: **106875077043**
   - Tên: **VONG VINH LOI**
   - Số tiền: **Đúng như đơn hàng**
   - Nội dung: **DAT MON [ORDER_NUMBER]**
5. Xác nhận → Nhập OTP → Hoàn tất

### Quan trọng:

⚠️ **KHÔNG thay đổi nội dung chuyển khoản!**  
⚠️ **Số tiền phải khớp 100%** (không làm tròn)

## 🎉 Xong!

Sau khi setup xong:

✅ Đơn hàng tự động xác nhận  
✅ Không cần xác nhận thủ công  
✅ Real-time notification  
✅ Transaction history đầy đủ  

## 🔗 Links hữu ích

- Casso Dashboard: https://app.casso.vn
- Casso Docs: https://docs.casso.vn
- VietQR API: https://vietqr.io
- Backend Docs: [Backend/order-service/CASSO_INTEGRATION.md](Backend/order-service/CASSO_INTEGRATION.md)

---

**Tích hợp hoàn tất! Chúc bạn thành công! 🚀**

