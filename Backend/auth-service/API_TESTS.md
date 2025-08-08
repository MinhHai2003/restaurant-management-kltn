# 🔐 Auth Service API Tests

## Base URL

```
http://localhost:5000
```

## 1. 🏠 Health Check

```http
GET /health
```

**Response:**

```json
{
  "success": true,
  "message": "Auth Service is running",
  "timestamp": "2025-08-08T02:30:00.000Z",
  "uptime": 120.5
}
```

## 2. 📝 Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@restaurant.com",
  "password": "Admin123",
  "role": "admin",
  "phone": "0123456789",
  "department": "management",
  "position": "General Manager",
  "salary": 50000000
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "66b4a1234567890123456789",
      "name": "Admin User",
      "email": "admin@restaurant.com",
      "role": "admin",
      "department": "management",
      "isActive": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 3. 🔐 Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@restaurant.com",
  "password": "Admin123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "66b4a1234567890123456789",
      "name": "Admin User",
      "email": "admin@restaurant.com",
      "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 4. 👤 Get Profile (Requires token)

```http
GET /api/auth/profile
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "_id": "66b4a1234567890123456789",
      "name": "Admin User",
      "email": "admin@restaurant.com",
      "role": "admin",
      "department": "management",
      "salary": 50000000,
      "hireDate": "2025-08-08T00:00:00.000Z"
    }
  }
}
```

## 5. 👥 Get All Employees (Admin/Manager only)

```http
GET /api/auth/employees?page=1&limit=10&role=waiter
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**

```json
{
  "success": true,
  "message": "Employees retrieved successfully",
  "data": {
    "employees": [
      {
        "_id": "66b4a1234567890123456790",
        "name": "Waiter 1",
        "email": "waiter1@restaurant.com",
        "role": "waiter",
        "department": "service",
        "isActive": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "pages": 2
    }
  }
}
```

## 6. 📊 Get Employee Statistics (Admin/Manager only)

```http
GET /api/auth/employees/stats
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**

```json
{
  "success": true,
  "message": "Employee statistics retrieved successfully",
  "data": {
    "general": {
      "totalEmployees": 15,
      "activeEmployees": 13,
      "inactiveEmployees": 2,
      "lockedEmployees": 0
    },
    "roleStats": [
      { "_id": "admin", "count": 1 },
      { "_id": "manager", "count": 2 },
      { "_id": "waiter", "count": 5 },
      { "_id": "chef", "count": 3 },
      { "_id": "cashier", "count": 2 }
    ],
    "departmentStats": [
      { "_id": "management", "count": 3, "avgSalary": 45000000 },
      { "_id": "service", "count": 5, "avgSalary": 15000000 },
      { "_id": "kitchen", "count": 3, "avgSalary": 20000000 }
    ]
  }
}
```

## 7. 🔄 Refresh Token

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "YOUR_REFRESH_TOKEN"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 8. 🚪 Logout

```http
POST /api/auth/logout
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

## 9. ✏️ Update Profile

```http
PUT /api/auth/profile
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "0987654321",
  "address": "123 New Address"
}
```

## 10. 🔑 Change Password

```http
PUT /api/auth/change-password
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "currentPassword": "Admin123",
  "newPassword": "NewAdmin123",
  "confirmPassword": "NewAdmin123"
}
```

## 11. 👥 Update Employee (Admin/Manager only)

```http
PUT /api/auth/employees/66b4a1234567890123456790
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "Updated Employee Name",
  "role": "manager",
  "salary": 25000000,
  "isActive": true
}
```

## 12. 🗑️ Delete Employee (Admin only)

```http
DELETE /api/auth/employees/66b4a1234567890123456790
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## 🎯 Postman Testing Guide:

### Common Issues & Solutions:

#### ❌ **Problem: req.body undefined**

```
Content-Type: text/plain  ← Wrong!
```

#### ✅ **Solution:**

1. **In Postman Body tab:**

   - Select **raw**
   - Choose **JSON** from dropdown (not Text)
   - Or manually add Header: `Content-Type: application/json`

2. **Example correct setup:**

```
PUT http://localhost:5000/api/auth/profile
Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Content-Type: application/json   ← Must be this!

Body (raw, JSON):
{
  "name": "Updated Name",
  "phone": "0987654321",
  "address": "New Address"
}
```

### Test sequence:

1. **Register** → Get tokens
2. **Login** → Get fresh tokens
3. **Update Profile** → Use access token
4. **Get Profile** → Verify changes

## Test với cURL:

### Test Health Check:

```bash
curl http://localhost:5000/health
```

### Test Register:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Manager",
    "email": "manager@test.com",
    "password": "Manager123",
    "role": "manager",
    "department": "management"
  }'
```

### Test Login:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@test.com",
    "password": "Manager123"
  }'
```

### Test Get Profile:

```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Error Responses:

### 400 - Validation Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

### 401 - Unauthorized:

```json
{
  "success": false,
  "message": "Access token required"
}
```

### 403 - Forbidden:

```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions"
}
```

### 429 - Rate Limited:

```json
{
  "success": false,
  "message": "Too many login attempts, please try again later",
  "retryAfter": "15 minutes"
}
```

## 🧪 Testing Checklist:

- [ ] Health check responds
- [ ] User registration works
- [ ] Login returns tokens
- [ ] Profile retrieval with token
- [ ] Employee management (admin only)
- [ ] Token refresh works
- [ ] Logout clears tokens
- [ ] Rate limiting active
- [ ] Validation errors proper
- [ ] Role-based access control
