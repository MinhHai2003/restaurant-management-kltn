# 👥 Customer Service API Documentation

## 🌐 Base URL

```
http://localhost:5002
```

## 📋 Table of Contents

- [Authentication](#authentication)
- [Profile Management](#profile-management)
- [Address Management](#address-management)
- [Loyalty Program](#loyalty-program)
- [Error Handling](#error-handling)
- [Testing](#testing)

---

## 🔐 Authentication

### 1. Register Customer

**Endpoint:** `POST /api/customers/register`

**Description:** Đăng ký tài khoản khách hàng mới

**Request Body:**

```json
{
  "name": "Nguyễn Văn A",
  "email": "customer@example.com",
  "password": "Customer123",
  "phone": "0123456789",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}
```

**Validation Rules:**

- `name`: Required, 2-50 characters
- `email`: Required, valid email format, unique
- `password`: Required, min 6 characters, at least 1 uppercase, 1 lowercase, 1 number
- `phone`: Required, Vietnamese phone format
- `dateOfBirth`: Optional, valid date
- `gender`: Optional, enum: ["male", "female", "other"]

**Response (201):**

```json
{
  "success": true,
  "message": "Customer registered successfully! Welcome bonus: 100 points",
  "data": {
    "customer": {
      "_id": "66b4a1234567890123456789",
      "name": "Nguyễn Văn A",
      "email": "customer@example.com",
      "phone": "0123456789",
      "loyaltyPoints": 100,
      "membershipLevel": "bronze",
      "totalSpent": 0,
      "totalOrders": 0,
      "allowNotifications": true,
      "isActive": true,
      "createdAt": "2025-08-08T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login Customer

**Endpoint:** `POST /api/customers/login`

**Description:** Đăng nhập cho khách hàng

**Request Body:**

```json
{
  "email": "customer@example.com",
  "password": "Customer123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "customer": {
      "_id": "66b4a1234567890123456789",
      "name": "Nguyễn Văn A",
      "email": "customer@example.com",
      "membershipLevel": "silver",
      "loyaltyPoints": 1250
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Refresh Token

**Endpoint:** `POST /api/customers/refresh-token`

**Description:** Làm mới access token

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 👤 Profile Management

### 4. Get Profile

**Endpoint:** `GET /api/customers/profile`

**Headers:** `Authorization: Bearer YOUR_ACCESS_TOKEN`

**Response (200):**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "customer": {
      "_id": "66b4a1234567890123456789",
      "name": "Nguyễn Văn A",
      "email": "customer@example.com",
      "phone": "0123456789",
      "dateOfBirth": "1990-01-01T00:00:00.000Z",
      "gender": "male",
      "loyaltyPoints": 1250,
      "membershipLevel": "silver",
      "totalSpent": 8500000,
      "totalOrders": 15,
      "allowNotifications": true,
      "preferences": {
        "dietaryRestrictions": ["vegetarian"],
        "spiceLevel": "mild",
        "favoriteCategories": ["pizza", "pasta"]
      },
      "addresses": [
        {
          "_id": "66b4a1234567890123456790",
          "label": "Nhà",
          "address": "123 Nguyễn Huệ, Q.1",
          "district": "Quận 1",
          "city": "TP.HCM",
          "isDefault": true
        }
      ],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-08-08T10:30:00.000Z"
    }
  }
}
```

### 5. Update Profile

**Endpoint:** `PUT /api/customers/profile`

**Headers:** `Authorization: Bearer YOUR_ACCESS_TOKEN`

**Request Body:**

```json
{
  "name": "Nguyễn Văn A Updated",
  "phone": "0987654321",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "preferences": {
    "dietaryRestrictions": ["vegetarian", "gluten-free"],
    "spiceLevel": "hot",
    "favoriteCategories": ["pizza", "pasta", "salad"]
  },
  "allowNotifications": false
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "customer": {
      "_id": "66b4a1234567890123456789",
      "name": "Nguyễn Văn A Updated",
      "phone": "0987654321",
      "preferences": {
        "dietaryRestrictions": ["vegetarian", "gluten-free"],
        "spiceLevel": "hot",
        "favoriteCategories": ["pizza", "pasta", "salad"]
      },
      "allowNotifications": false,
      "updatedAt": "2025-08-08T10:30:00.000Z"
    }
  }
}
```

---

## 📍 Address Management

### 6. Get All Addresses

**Endpoint:** `GET /api/customers/addresses`

**Headers:** `Authorization: Bearer YOUR_ACCESS_TOKEN`

**Response (200):**

```json
{
  "success": true,
  "message": "Addresses retrieved successfully",
  "data": {
    "addresses": [
      {
        "_id": "66b4a1234567890123456790",
        "label": "Nhà",
        "address": "123 Nguyễn Huệ, Q.1",
        "district": "Quận 1",
        "city": "TP.HCM",
        "isDefault": true,
        "createdAt": "2025-08-08T10:30:00.000Z"
      },
      {
        "_id": "66b4a1234567890123456791",
        "label": "Công ty",
        "address": "456 Lê Lợi, Q.3",
        "district": "Quận 3",
        "city": "TP.HCM",
        "isDefault": false,
        "createdAt": "2025-08-08T11:00:00.000Z"
      }
    ]
  }
}
```

### 7. Add New Address

**Endpoint:** `POST /api/customers/addresses`

**Headers:** `Authorization: Bearer YOUR_ACCESS_TOKEN`

**Request Body:**

```json
{
  "label": "Văn phòng",
  "address": "789 Trần Hưng Đạo, Q.5",
  "district": "Quận 5",
  "city": "TP.HCM",
  "isDefault": false
}
```

**Validation Rules:**

- `label`: Required, max 50 characters
- `address`: Required, max 200 characters
- `district`: Required, max 50 characters
- `city`: Required, max 50 characters
- `isDefault`: Optional, boolean

**Response (201):**

```json
{
  "success": true,
  "message": "Address added successfully",
  "data": {
    "address": {
      "_id": "66b4a1234567890123456792",
      "label": "Văn phòng",
      "address": "789 Trần Hưng Đạo, Q.5",
      "district": "Quận 5",
      "city": "TP.HCM",
      "isDefault": false,
      "createdAt": "2025-08-08T12:00:00.000Z"
    }
  }
}
```

### 8. Update Address

**Endpoint:** `PUT /api/customers/addresses/:addressId`

**Headers:** `Authorization: Bearer YOUR_ACCESS_TOKEN`

**URL Example:** `PUT /api/customers/addresses/6895f3d505329565cb81c377`

**Request Body:**

```json
{
  "label": "Nhà riêng",
  "address": "123 Nguyễn Huệ, Q.1 (Updated)",
  "district": "Quận 1",
  "city": "TP.HCM",
  "isDefault": true
}
```

### 9. Delete Address

**Endpoint:** `DELETE /api/customers/addresses/:addressId`

**Headers:** `Authorization: Bearer YOUR_ACCESS_TOKEN`

**URL Example:** `DELETE /api/customers/addresses/6895f3d505329565cb81c377`

**Response (200):**

```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

---

## 🏆 Loyalty Program

### 10. Get Loyalty Info

**Endpoint:** `GET /api/customers/loyalty`

**Headers:** `Authorization: Bearer YOUR_ACCESS_TOKEN`

**Response (200):**

```json
{
  "success": true,
  "message": "Loyalty info retrieved successfully",
  "data": {
    "loyaltyPoints": 1250,
    "membershipLevel": "silver",
    "totalSpent": 8500000,
    "totalOrders": 15,
    "pointsToNextLevel": 11500000,
    "nextLevel": "gold",
    "levelBenefits": {
      "discountPercent": 5,
      "freeDelivery": false,
      "prioritySupport": true,
      "specialOffers": true
    },
    "recentTransactions": [
      {
        "type": "earned",
        "points": 50,
        "description": "Order #ORD-001",
        "date": "2025-08-07T15:30:00.000Z"
      },
      {
        "type": "redeemed",
        "points": -100,
        "description": "Free appetizer",
        "date": "2025-08-06T12:00:00.000Z"
      }
    ]
  }
}
```

### 11. Redeem Points

**Endpoint:** `POST /api/customers/loyalty/redeem`

**Headers:** `Authorization: Bearer YOUR_ACCESS_TOKEN`

**Request Body:**

```json
{
  "points": 500,
  "rewardType": "discount",
  "description": "5% discount voucher"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Points redeemed successfully",
  "data": {
    "transaction": {
      "type": "redeemed",
      "points": -500,
      "description": "5% discount voucher",
      "date": "2025-08-08T10:30:00.000Z"
    },
    "remainingPoints": 750,
    "voucherCode": "DISCOUNT5-ABC123"
  }
}
```

---

## 🏥 Health Check

### 12. Health Check

**Endpoint:** `GET /health`

**Description:** Kiểm tra trạng thái service

**Response (200):**

```json
{
  "status": "OK",
  "service": "Customer Service",
  "timestamp": "2025-08-08T10:30:00.000Z",
  "uptime": "2 hours 15 minutes",
  "database": "Connected",
  "version": "1.0.0"
}
```

---

## ❌ Error Handling

### Error Response Format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Email already exists"
    }
  ]
}
```

### Common HTTP Status Codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `409` - Conflict (duplicate data)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Example Error Responses:

**Validation Error (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "details": [
    {
      "field": "password",
      "message": "Password must contain at least 6 characters with 1 uppercase, 1 lowercase and 1 number"
    }
  ]
}
```

**Authentication Error (401):**

```json
{
  "success": false,
  "message": "Access token is missing or invalid",
  "error": "AUTHENTICATION_ERROR"
}
```

**Duplicate Email (409):**

```json
{
  "success": false,
  "message": "Email already registered",
  "error": "DUPLICATE_EMAIL"
}
```

---

## 🎯 Features Overview

### ✅ **Authentication & Security:**

- JWT-based authentication with refresh tokens
- Password hashing with bcryptjs
- Input validation and sanitization
- Rate limiting protection
- CORS and security headers

### 👤 **Customer Management:**

- Complete profile management
- Multiple delivery addresses
- Food preferences and dietary restrictions
- Notification settings control

### 🏆 **Loyalty Program:**

- Automatic points earning (1 point per 10,000 VNĐ)
- Membership levels with benefits
- Points redemption system
- Transaction history

### 📊 **Membership Levels:**

- 🥉 **Bronze (0 - 5M VNĐ):** 0% discount, basic support
- 🥈 **Silver (5M - 20M VNĐ):** 5% discount, priority support
- 🥇 **Gold (20M - 50M VNĐ):** 10% discount, free delivery over 200k
- 💎 **Platinum (50M+ VNĐ):** 15% discount, free delivery, exclusive offers

---

## 🧪 Testing

### Quick Test Commands (PowerShell):

**1. Health Check:**

```powershell
Invoke-RestMethod -Uri "http://localhost:5002/health" -Method GET
```

**2. Register Customer:**

```powershell
$registerData = @{
    name = "Test Customer"
    email = "test@customer.com"
    password = "Test123"
    phone = "0123456789"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5002/api/customers/register" -Method POST -Body $registerData -ContentType "application/json"
```

**3. Login:**

```powershell
$loginData = @{
    email = "test@customer.com"
    password = "Test123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5002/api/customers/login" -Method POST -Body $loginData -ContentType "application/json"
$token = $response.data.accessToken
```

**4. Get Profile:**

```powershell
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:5002/api/customers/profile" -Method GET -Headers $headers
```

**5. Add Address:**

```powershell
$addressData = @{
    label = "Nhà"
    address = "123 Test Street"
    district = "Quận 1"
    city = "TP.HCM"
    isDefault = $true
} | ConvertTo-Json

$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:5002/api/customers/addresses" -Method POST -Body $addressData -ContentType "application/json" -Headers $headers
```

### cURL Examples:

**Register:**

```bash
curl -X POST http://localhost:5002/api/customers/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "test@customer.com",
    "password": "Test123",
    "phone": "0123456789"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:5002/api/customers/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@customer.com",
    "password": "Test123"
  }'
```

**Get Profile:**

```bash
curl -X GET http://localhost:5002/api/customers/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔧 Technical Stack

- **Framework:** Express.js 4.21.1
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT)
- **Security:** bcryptjs, helmet, express-rate-limit
- **Validation:** express-validator
- **Architecture:** RESTful API, Microservice pattern
- **Port:** 5002

---

## 📝 Notes

1. **Rate Limiting:** 100 requests per 15 minutes per IP
2. **Token Expiry:** Access tokens expire in 1 hour, refresh tokens in 7 days
3. **Password Policy:** Minimum 6 characters, must contain uppercase, lowercase, and number
4. **Loyalty Points:** Automatically calculated based on order total (1 point = 10,000 VNĐ)
5. **Membership Levels:** Updated automatically when totalSpent changes
6. **Default Address:** Only one address can be set as default at a time

---

_Last updated: August 8, 2025_
