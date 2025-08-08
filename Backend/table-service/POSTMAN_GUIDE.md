# 🚀 HƯỚNG DẪN TEST BẰNG POSTMAN

## 📋 CHUẨN BỊ

### 1. Import Collection & Environment

1. Mở Postman
2. Click **Import**
3. Import 2 files:
   - `Table_Reservation_API.postman_collection.json`
   - `Table_Reservation_Environment.postman_environment.json`
4. Chọn Environment **"Table & Reservation API Environment"** ở góc trên bên phải

### 2. Kiểm tra Services đang chạy

- ✅ Table Service: http://localhost:5006
- ✅ Customer Service: http://localhost:5002

---

## 🎯 THỨ TỰ TEST (QUAN TRỌNG!)

### **BƯỚC 1: Health Checks** 🚀

Chạy folder **"🚀 1. Health Checks"**

- **Table Service Health** - Kiểm tra service hoạt động
- **Customer Service Health** - Kiểm tra customer service

### **BƯỚC 2: Table Management** 🍽️

Chạy folder **"🍽️ 2. Table Management"**

- **Search Tables - Tomorrow Evening** ⭐ **QUAN TRỌNG** - Tự động lưu TABLE_ID
- **Get All Tables** - Xem danh sách bàn
- **Search VIP Tables** - Tìm phòng VIP
- **Search Pet-Friendly Tables** - Tìm bàn thú cưng
- **Get Table Statistics** - Thống kê
- **Get Table Details** - Chi tiết bàn
- **Get Table Availability Calendar** - Lịch trống

### **BƯỚC 3: Customer Authentication** 👤

Chạy folder **"👤 3. Customer Authentication"**

- **Customer Login** ⭐ **QUAN TRỌNG** - Tự động lưu CUSTOMER_TOKEN
- **Customer Register** (Optional) - Tạo tài khoản mới

### **BƯỚC 4: Reservation Management** 📅

Chạy folder **"📅 4. Reservation Management"**

- **Create Reservation - Birthday** ⭐ **QUAN TRỌNG** - Tự động lưu RESERVATION_NUMBER
- **Create VIP Reservation** - Đặt phòng VIP
- **Get Customer Reservations** - Xem đặt chỗ
- **Get Upcoming Reservations** - Đặt chỗ sắp tới
- **Get Specific Reservation** - Chi tiết đặt chỗ
- **Update Reservation** - Sửa đặt chỗ
- **Rate Reservation** - Đánh giá
- **Cancel Reservation** - Hủy đặt chỗ
- **Get Reservation Statistics** - Thống kê

### **BƯỚC 5: Error Testing** 🧪

Chạy folder **"🧪 5. Error Testing"**

- **❌ Create Reservation Without Token** - Test lỗi 401
- **❌ Search with Invalid Date** - Test lỗi 400
- **❌ Reservation with Party Size Too Large** - Test validation

---

## 🎮 CÁCH SỬ DỤNG

### ⚡ Chạy Tự Động (Khuyến nghị)

1. **Right-click** vào **Collection name** → **Run collection**
2. Chọn **Run order**: Chạy theo thứ tự folder
3. Click **Run Table & Reservation API Tests**
4. Xem kết quả test tự động

### 🎯 Chạy Từng Request

1. Bắt đầu với **Search Tables - Tomorrow Evening** để lấy TABLE_ID
2. Chạy **Customer Login** để lấy CUSTOMER_TOKEN
3. Chạy **Create Reservation** để lấy RESERVATION_NUMBER
4. Tiếp tục với các request khác

---

## 🔧 ENVIRONMENT VARIABLES

Các biến được tự động lưu khi chạy test:

| Variable             | Mô tả                 | Tự động lưu từ     |
| -------------------- | --------------------- | ------------------ |
| `BASE_URL_TABLE`     | http://localhost:5006 | Cố định            |
| `BASE_URL_CUSTOMER`  | http://localhost:5002 | Cố định            |
| `CUSTOMER_TOKEN`     | JWT token khách hàng  | Customer Login     |
| `TABLE_ID`           | ID bàn để đặt         | Search Tables      |
| `RESERVATION_NUMBER` | Mã đặt bàn            | Create Reservation |

---

## 📊 KẾT QUẢ MONG ĐỢI

### ✅ Successful Responses

- **200 OK**: GET requests thành công
- **201 Created**: Tạo reservation thành công
- **Token Auto-Saved**: Thấy token trong Console
- **IDs Auto-Saved**: TABLE_ID và RESERVATION_NUMBER tự động lưu

### ❌ Expected Errors

- **401 Unauthorized**: Khi không có token
- **400 Bad Request**: Khi dữ liệu không hợp lệ
- **409 Conflict**: Khi bàn đã được đặt

---

## 🔍 KIỂM TRA KẾT QUẢ

### Trong Postman Console

```javascript
Token saved: eyJhbGciOiJIUzI1NiIsInR5...
Saved TABLE_ID: 689631c666f40973a42273a6
Reservation Number saved: RSV-20250809-123456
```

### Response Examples

```json
// Search Tables Response
{
  "success": true,
  "data": {
    "tables": [...],
    "total": 6
  }
}

// Create Reservation Response
{
  "success": true,
  "data": {
    "reservation": {
      "reservationNumber": "RSV-20250809-123456",
      "tableNumber": "T002",
      "status": "pending",
      "pricing": {
        "total": 0
      }
    }
  }
}
```

---

## 🎯 TIPS VÀ TRICKS

### 1. Pre-request Scripts

Collection tự động:

- Lưu token từ login response
- Lưu TABLE_ID từ search response
- Lưu RESERVATION_NUMBER từ create response

### 2. Test Scripts

Mỗi request có test tự động:

- Kiểm tra status code
- Validate response structure
- Console logging cho debug

### 3. Thứ tự quan trọng

⚠️ **Phải chạy theo thứ tự:**

1. Search Tables (lấy TABLE_ID)
2. Customer Login (lấy TOKEN)
3. Create Reservation (lấy RESERVATION_NUMBER)
4. Các requests khác

### 4. Debug Issues

- Check **Console** tab cho logs
- Check **Environment** có đủ variables không
- Verify services đang chạy đúng ports

---

## 🚀 QUICK START

1. **Import** 2 files JSON vào Postman
2. **Select** Environment: "Table & Reservation API Environment"
3. **Run Collection** hoặc chạy từng folder theo thứ tự
4. **Check Console** cho auto-saved variables
5. **Enjoy testing!** 🎉

---

## 📞 TROUBLESHOOTING

| Lỗi                | Nguyên nhân        | Giải pháp                   |
| ------------------ | ------------------ | --------------------------- |
| Connection Error   | Service không chạy | Kiểm tra port 5006, 5002    |
| 401 Unauthorized   | Chưa login         | Chạy Customer Login trước   |
| TABLE_ID undefined | Chưa search tables | Chạy Search Tables trước    |
| 409 Conflict       | Bàn đã đặt         | Đổi thời gian hoặc bàn khác |

**Happy Testing!** 🎊
