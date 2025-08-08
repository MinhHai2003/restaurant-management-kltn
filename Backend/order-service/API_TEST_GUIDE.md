# 🧪 API Testing Guide - Restaurant Management System

## 📋 Services Status

- ✅ **Customer Service** - Port 5002
- ✅ **Menu Service** - Port 5003
- ✅ **Inventory Service** - Port 5004
- ✅ **Order Service** - Port 5005
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

### 2.3 Xem profile khách hàng

```bash
GET http://localhost:5002/api/customers/profile
Authorization: Bearer YOUR_TOKEN_HERE
```

### 2.4 Thêm địa chỉ giao hàng

```json
POST http://localhost:5002/api/customers/addresses
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "label": "Nhà",
  "address": "123 Nguyen Trai, District 1, Ho Chi Minh City",
  "district": "District 1",
  "city": "Ho Chi Minh City",
  "isDefault": true
}
```

---

## 🍽️ 3. Menu Service Tests

### 3.1 Tạo món ăn mới (chỉ JSON, không có ảnh)

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

### 3.1b Tạo món ăn có hình ảnh (với Postman)

```bash
POST http://localhost:5003/api/menu
Content-Type: multipart/form-data

Form-data fields:
- name: "Pho Bo Dac Biet"
- description: "Special beef noodle soup"
- price: "65000"
- category: "noodles"
- available: "true"
- image: [Chọn file ảnh]
```

### 3.2 Xem tất cả món ăn

```bash
GET http://localhost:5003/api/menu
```

### 3.3 Tìm kiếm món ăn

```bash
GET http://localhost:5003/api/menu/search?query=pho
```

### 3.4 Lọc theo danh mục

```bash
GET http://localhost:5003/api/menu/category/noodles
```

### 3.5 Upload ảnh món ăn (với Postman)

```bash
POST http://localhost:5003/api/menu/upload
Content-Type: multipart/form-data
Body: form-data
Key: image
Value: [Chọn file ảnh]
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
  "status": "in-stock",
  "supplier": "Local Kitchen",
  "note": "Fresh ingredients daily"
}
```

### 4.2 Xem tất cả inventory

```bash
GET http://localhost:5004/api/inventory
```

### 4.3 Kiểm tra món sắp hết hàng

```bash
GET http://localhost:5004/api/inventory/low-stock
```

### 4.4 Cập nhật stock

```json
PUT http://localhost:5004/api/inventory/ITEM_ID
Content-Type: application/json

{
  "currentStock": 150,
  "lastRestocked": "2025-08-08T15:30:00.000Z"
}
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
      "customizations": "Extra herbs please",
      "notes": "Spicy level medium"
    }
  ],
  "delivery": {
    "type": "delivery",
    "address": {
      "full": "123 Nguyen Trai, District 1, Ho Chi Minh City",
      "district": "District 1",
      "city": "Ho Chi Minh City"
    },
    "instructions": "Call when arrived"
  },
  "payment": {
    "method": "cash"
  },
  "notes": {
    "customer": "Please deliver quickly"
  }
}
```

### 5.2 Xem đơn hàng của khách hàng

```bash
GET http://localhost:5005/api/orders
Authorization: Bearer YOUR_CUSTOMER_TOKEN
```

### 5.3 Theo dõi đơn hàng

```bash
GET http://localhost:5005/api/orders/track/ORDER_NUMBER
```

### 5.4 Đánh giá đơn hàng

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

### 5.5 Đặt lại đơn hàng

```json
POST http://localhost:5005/api/orders/ORDER_NUMBER/reorder
Authorization: Bearer YOUR_CUSTOMER_TOKEN
Content-Type: application/json

{
  "delivery": {
    "address": {
      "full": "456 Le Loi, District 3, Ho Chi Minh City",
      "district": "District 3",
      "city": "Ho Chi Minh City"
    },
    "instructions": "Leave at door"
  }
}
```

---

## 🛠️ Testing Tools

### 1. **Postman** (Khuyến nghị)

- Import collection từ file JSON
- Dễ dàng quản lý environment variables
- Có thể save requests để test lại

### 2. **VS Code REST Client**

- Install extension "REST Client"
- Tạo file `.http` với các requests
- Test trực tiếp trong VS Code

### 3. **Thunder Client** (VS Code Extension)

- Lightweight alternative cho Postman
- Tích hợp trong VS Code

---

## 🔍 Testing Scenarios

### Scenario 1: Complete Order Flow

1. Đăng ký/đăng nhập customer
2. Xem menu có sẵn
3. Thêm địa chỉ giao hàng
4. Tạo đơn hàng
5. Theo dõi đơn hàng
6. Đánh giá đơn hàng

### Scenario 2: Inventory Management

1. Thêm món ăn vào menu
2. Thêm inventory cho món ăn đó
3. Tạo đơn hàng với món ăn đó
4. Kiểm tra inventory sau khi đặt hàng
5. Update stock khi cần

### Scenario 3: Error Handling

1. Test với token không hợp lệ
2. Test với dữ liệu thiếu/sai
3. Test đặt hàng món không có sẵn
4. Test vượt quá stock

---

## 📝 Test Data Examples

### Sample Customer Data

```json
{
  "name": "Nguyen Van A",
  "email": "customer1@test.com",
  "password": "password123",
  "phone": "0901234567"
}
```

### Sample Menu Items

```json
[
  {
    "name": "Pho Bo",
    "price": 50000,
    "category": "noodles",
    "description": "Traditional beef noodle soup",
    "available": true
  },
  {
    "name": "Banh Mi",
    "price": 25000,
    "category": "sandwiches",
    "description": "Vietnamese baguette sandwich",
    "available": true
  },
  {
    "name": "Com Tam",
    "price": 45000,
    "category": "rice",
    "description": "Broken rice with grilled pork",
    "available": true
  }
]
```

---

## ⚠️ Important Notes

1. **Auth Service Issue**: Hiện tại auth-service có lỗi dependency, cần fix trước khi test
2. **Token Management**: Lưu token sau khi login để dùng cho các requests khác
3. **Database**: Tất cả services đang dùng MongoDB Atlas (cloud)
4. **CORS**: Có thể cần config CORS nếu test từ browser
5. **Rate Limiting**: Một số endpoints có rate limiting, chú ý khi test

---

## 🚀 Next Steps

1. **Fix Auth Service** để có authentication đầy đủ
2. **Test Integration** giữa các services
3. **Performance Testing** với nhiều requests đồng thời
4. **Error Handling** testing
5. **Security Testing** với các attack vectors phổ biến
