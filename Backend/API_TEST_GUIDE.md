# 🧪 API Testing Guide - Restaurant Management System

## 📋 Services Status

- ✅ **Customer Service** - Port 5002
- ✅ **Menu Service** - Port 5003
- ✅ **Inventory Service** - Port 5004
- ✅ **Order Service** - Port 5005
- ✅ **Table Service** - Port 5006
- ❌ **Auth Service** - Port 5001 (có lỗi dependency)

---

## 🚀 1. Kiểm tra Health Check

### Customer Service

```bash
GET http://localhost:5002/health
```

### Menu Service

```bash
GET http://localhost:5003/health
```

### Inventory Service

```bash
GET http://localhost:5004/health
```

### Order Service

```bash
GET http://localhost:5005/health
```

### Table Service

```bash
GET http://localhost:5006/health
```

---

## 👤 2. Customer Service Tests

### 2.1 Đăng ký khách hàng mới

```json
POST http://localhost:5002/api/customers/register
Content-Type: application/json

{
  "name": "Nguyen Van Test",
  "email": "test@example.com",
  "password": "password123",
  "phone": "0123456789"
}
```

### 2.2 Đăng nhập khách hàng

```json
POST http://localhost:5002/api/customers/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Lưu ý:** Sao chép `token` từ response để dùng cho các requests khác.

---

## 🍽️ 3. Menu Service Tests

### 3.1 Tạo món ăn mới (chỉ JSON)

```json
POST http://localhost:5003/api/menu/json-only
Content-Type: application/json

{
  "name": "Pho Bo",
  "description": "Traditional Vietnamese beef noodle soup",
  "price": 50000,
  "category": "noodles",
  "available": true
}
```

### 3.2 Xem tất cả món ăn

```bash
GET http://localhost:5003/api/menu
```

---

## 📦 4. Inventory Service Tests

### 4.1 Thêm inventory item

```json
POST http://localhost:5004/api/inventory
Content-Type: application/json

{
  "name": "Pho Bo",
  "quantity": 100,
  "unit": "serving",
  "status": "in-stock"
}
```

### 4.2 Xem tất cả inventory

```bash
GET http://localhost:5004/api/inventory
```

---

## 🛒 5. Order Service Tests

### 5.1 Tạo đơn hàng mới

```json
POST http://localhost:5005/api/orders
Authorization: Bearer YOUR_CUSTOMER_TOKEN
Content-Type: application/json

{
  "items": [
    {
      "menuItemId": "MENU_ITEM_ID_FROM_STEP_3",
      "quantity": 2,
      "customizations": "Extra herbs please"
    }
  ],
  "delivery": {
    "type": "delivery",
    "address": {
      "full": "123 Nguyen Trai, District 1, Ho Chi Minh City",
      "district": "District 1",
      "city": "Ho Chi Minh City"
    }
  },
  "payment": {
    "method": "cash"
  }
}
```

### 5.2 Theo dõi đơn hàng

```bash
GET http://localhost:5005/api/orders/track/ORDER_NUMBER
```

### 5.3 Đánh giá đơn hàng

```json
POST http://localhost:5005/api/orders/ORDER_NUMBER/rate
Authorization: Bearer YOUR_CUSTOMER_TOKEN
Content-Type: application/json

{
  "food": 5,
  "delivery": 4,
  "overall": 5,
  "comment": "Delicious food, fast delivery!"
}
```

---

## 🍽️ 6. Table Service Tests

### 6.1 Xem tất cả bàn ăn

```bash
GET http://localhost:5006/api/tables
```

### 6.2 Tìm kiếm bàn trống

```bash
GET http://localhost:5006/api/tables/search?date=2025-08-09&startTime=19:00&endTime=21:00&partySize=4
```

### 6.3 Xem chi tiết một bàn

```bash
GET http://localhost:5006/api/tables/TABLE_ID
```

### 6.4 Thống kê bàn ăn

```bash
GET http://localhost:5006/api/tables/stats
```

---

## 📅 7. Reservation Service Tests

### 7.1 Đặt bàn mới

```json
POST http://localhost:5006/api/reservations
Authorization: Bearer YOUR_CUSTOMER_TOKEN
Content-Type: application/json

{
  "tableId": "TABLE_ID_FROM_SEARCH",
  "reservationDate": "2025-08-09",
  "startTime": "19:00",
  "endTime": "21:00",
  "partySize": 4,
  "occasion": "birthday",
  "specialRequests": "Window seat preferred, birthday cake setup"
}
```

### 7.2 Xem đặt bàn của khách hàng

```bash
GET http://localhost:5006/api/reservations
Authorization: Bearer YOUR_CUSTOMER_TOKEN
```

### 7.3 Xem chi tiết đặt bàn

```bash
GET http://localhost:5006/api/reservations/RESERVATION_NUMBER
Authorization: Bearer YOUR_CUSTOMER_TOKEN
```

### 7.4 Sửa đặt bàn

```json
PUT http://localhost:5006/api/reservations/RESERVATION_NUMBER
Authorization: Bearer YOUR_CUSTOMER_TOKEN
Content-Type: application/json

{
  "partySize": 6,
  "specialRequests": "Need high chair for baby"
}
```

### 7.5 Hủy đặt bàn

```json
DELETE http://localhost:5006/api/reservations/RESERVATION_NUMBER
Authorization: Bearer YOUR_CUSTOMER_TOKEN
Content-Type: application/json

{
  "reason": "Plans changed"
}
```

### 7.6 Đánh giá sau khi dùng bữa

```json
POST http://localhost:5006/api/reservations/RESERVATION_NUMBER/rate
Authorization: Bearer YOUR_CUSTOMER_TOKEN
Content-Type: application/json

{
  "service": 5,
  "ambiance": 4,
  "overall": 5,
  "comment": "Excellent service and atmosphere!"
}
```

### 7.7 Thống kê đặt bàn

```bash
GET http://localhost:5006/api/reservations/stats
Authorization: Bearer YOUR_CUSTOMER_TOKEN
```

---

## 🔍 Testing Scenarios

### Scenario 1: Complete Dining Experience

1. Đăng ký/đăng nhập customer
2. Tìm kiếm bàn trống cho ngày mai
3. Đặt bàn cho dịp sinh nhật
4. Xem chi tiết đặt bàn
5. Đánh giá sau khi dùng bữa

### Scenario 2: Order + Reservation Combo

1. Đặt bàn trước
2. Pre-order món ăn (sẽ implement sau)
3. Check-in khi đến nhà hàng
4. Đánh giá cả đồ ăn và dịch vụ

### Scenario 3: Event Planning

1. Tìm phòng VIP cho sự kiện
2. Đặt bàn với yêu cầu đặc biệt
3. Sửa đổi số lượng khách
4. Xác nhận và thanh toán

---

## 📊 Table Types & Pricing

### 🏠 Indoor Tables (FREE)

- **T001**: 2 chỗ - Cửa sổ, điều hòa - Miễn phí
- **T002**: 4 chỗ - Gia đình nhỏ - Miễn phí
- **T003**: 6 chỗ - Khu vực yên tĩnh - ₫50,000 (peak: ₫60k, weekend: ₫75k)
- **T004**: 2 chỗ - Gần lối vào - Miễn phí

### 🌿 Outdoor Tables

- **O001**: 4 chỗ - Ban công view thành phố - ₫30,000 (peak: ₫39k, weekend: ₫54k)
- **O002**: 6 chỗ - Khu vườn, thú cưng OK - ₫40,000 (peak: ₫52k, weekend: ₫72k)

### 👑 VIP Private Rooms

- **V001**: 8 chỗ - Phòng riêng VIP - ₫200,000 (peak: ₫300k, weekend: ₫400k)
- **V002**: 12 chỗ - Phòng sự kiện lớn - ₫350,000 (peak: ₫525k, weekend: ₫700k)

**Peak Hours**: 18:00-21:00 (giờ cao điểm)  
**Weekend**: Thứ 7 & Chủ nhật

---

## 📝 Sample Data

### Table Search Results Example

```json
{
  "success": true,
  "data": {
    "tables": [
      {
        "tableNumber": "T002",
        "capacity": 4,
        "location": "indoor",
        "features": ["air_conditioned"],
        "pricing": {
          "calculatedPrice": 0
        },
        "description": "Perfect for small families"
      }
    ],
    "total": 6
  }
}
```

### Reservation Response Example

```json
{
  "success": true,
  "data": {
    "reservation": {
      "reservationNumber": "RSV-20250809-123456",
      "tableNumber": "T002",
      "reservationDate": "2025-08-09T00:00:00.000Z",
      "timeSlot": {
        "startTime": "19:00",
        "endTime": "21:00",
        "duration": 120
      },
      "status": "pending",
      "pricing": {
        "tablePrice": 0,
        "serviceCharge": 0,
        "total": 0
      }
    }
  }
}
```

---

## ⚠️ Important Notes

1. **Table Service**: Mới được tạo, đang chạy port 5006
2. **Reservation System**: Tự động tính giá theo giờ cao điểm và weekend
3. **Authentication**: Tất cả reservation APIs cần customer token
4. **Pricing Logic**:
   - Peak hour (18-21h): tăng 20-50%
   - Weekend: tăng 50-100%
   - VIP rooms: có phí riêng
5. **Cancellation Policy**: Chỉ hủy được nếu còn hơn 2 tiếng

---

## 🚀 Next Steps

1. **Integration Testing**: Test luồng đặt bàn + order
2. **Payment Integration**: Thêm thanh toán đặt cọc
3. **Notification System**: SMS/Email nhắc nhở
4. **Admin Panel**: Quản lý bàn và đặt chỗ cho staff
5. **Real-time Updates**: WebSocket cho trạng thái bàn
