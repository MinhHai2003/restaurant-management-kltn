# 🔐 Auth Service API Tests

## Base URL

```
http://localhost:5000
```

## 1. 🏠 Health Check

```http
GET /health
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

## 3. 🔐 Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@restaurant.com",
  "password": "Admin123"
}
```

## 4. 👤 Get Profile (Requires token)

```http
GET /api/auth/profile
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## 5. 👥 Get All Employees (Admin/Manager only)

```http
GET /api/auth/employees
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## 6. 📊 Get Employee Statistics (Admin/Manager only)

```http
GET /api/auth/employees/stats
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## 7. 🔄 Refresh Token

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "YOUR_REFRESH_TOKEN"
}
```

## 8. 🚪 Logout

```http
POST /api/auth/logout
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Test với Postman hoặc curl:

### Test Health Check:

```bash
curl http://localhost:5000/health
```

### Test Register:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manager Test",
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
