# Cart API Documentation

## Overview

Cart API provides comprehensive shopping cart functionality for the restaurant ordering system, compatible with https://haisanbiendong.vn/gio-hang.html features.

## Base URL

```
http://localhost:5005/api/cart
```

## Authentication

All endpoints require customer authentication via `Authorization: Bearer <token>` header.

## Endpoints

### 🛒 Get Cart

```http
GET /api/cart
```

**Response:**

```json
{
  "success": true,
  "message": "Cart retrieved successfully",
  "data": {
    "cart": {
      "_id": "64f...",
      "customerId": "64f...",
      "items": [
        {
          "_id": "64f...",
          "menuItemId": "64f...",
          "name": "Tôm Alaska Đang Bơi",
          "price": 999000,
          "quantity": 2,
          "image": "https://...",
          "customizations": "",
          "notes": "",
          "subtotal": 1998000
        }
      ],
      "summary": {
        "totalItems": 2,
        "subtotal": 1998000,
        "deliveryFee": 0,
        "discount": 0,
        "tax": 159840,
        "total": 2157840
      },
      "appliedCoupon": null,
      "delivery": {
        "type": "delivery",
        "estimatedTime": 30,
        "fee": 0
      }
    }
  }
}
```

### ➕ Add Item to Cart

```http
POST /api/cart/add
```

**Request Body:**

```json
{
  "menuItemId": "64f...",
  "quantity": 2,
  "customizations": "Không cay",
  "notes": "Gói riêng"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "data": {
    "cart": {
      /* Updated cart object */
    },
    "addedItem": {
      "name": "Tôm Alaska Đang Bơi",
      "quantity": 2,
      "price": 999000
    }
  }
}
```

### 🔄 Update Cart Item

```http
PUT /api/cart/items/:itemId
```

**Request Body:**

```json
{
  "quantity": 3
}
```

**Note:** Set quantity to 0 to remove item.

### ❌ Remove Item from Cart

```http
DELETE /api/cart/items/:itemId
```

### 🗑️ Clear Cart

```http
DELETE /api/cart/clear
```

### 🎫 Apply Coupon

```http
POST /api/cart/coupon
```

**Request Body:**

```json
{
  "couponCode": "WELCOME10"
}
```

**Available Test Coupons:**

- `WELCOME10` - 10% discount
- `SAVE50K` - 50,000 VND discount
- `FREESHIP` - Free shipping

### 🎫 Remove Coupon

```http
DELETE /api/cart/coupon
```

### 🚚 Update Delivery Information

```http
PUT /api/cart/delivery
```

**Request Body:**

```json
{
  "type": "delivery",
  "addressId": "64f...", // Optional: Customer's saved address
  "address": {
    // Optional: Custom address
    "full": "123 Nguyễn Văn A, P.1, Q.1, TP.HCM",
    "district": "Quận 1",
    "city": "TP.HCM"
  },
  "estimatedTime": 45
}
```

### 📊 Get Cart Summary

```http
GET /api/cart/summary
```

**Response:**

```json
{
  "success": true,
  "message": "Cart summary retrieved successfully",
  "data": {
    "summary": {
      "totalItems": 3,
      "subtotal": 1500000,
      "deliveryFee": 30000,
      "discount": 150000,
      "tax": 120000,
      "total": 1500000
    },
    "itemCount": 3
  }
}
```

### 💳 Checkout Cart

```http
POST /api/cart/checkout
```

**Request Body:**

```json
{
  "payment": {
    "method": "momo"
  },
  "notes": {
    "customer": "Giao hàng trước 6PM",
    "kitchen": "Không cay",
    "delivery": "Gọi trước khi giao"
  }
}
```

**Response:** Creates order and clears cart automatically.

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "quantity",
      "message": "Quantity must be between 1 and 50"
    }
  ]
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Menu item not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to add item to cart",
  "error": "Database connection error"
}
```

## Features Compatibility

### ✅ Fully Compatible with haisanbiendong.vn:

- ✅ Add/remove items with quantity
- ✅ Real-time total calculation
- ✅ Delivery fee calculation
- ✅ Coupon/discount system
- ✅ Multiple delivery options
- ✅ Customer notes and customizations
- ✅ Persistent cart storage
- ✅ Tax calculation (8% VAT)
- ✅ Free shipping threshold (500k+)

### 🔄 Cart Lifecycle:

1. **Auto-created** when first item added
2. **Auto-updated** on item changes
3. **Auto-expires** after 24 hours of inactivity
4. **Auto-cleared** after successful checkout

### 💡 Business Logic:

- Free delivery for orders > 500,000 VND
- 8% VAT calculation
- Automatic coupon validation
- Stock availability checking
- Price consistency validation

## Testing

Use Postman collection or HTTP files to test the endpoints:

```bash
# Get cart
GET http://localhost:5005/api/cart
Authorization: Bearer <your-token>

# Add item
POST http://localhost:5005/api/cart/add
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "menuItemId": "64f...",
  "quantity": 2
}
```

## Integration Notes

- Requires **menu-service** running on port 5003
- Requires **customer-service** for authentication
- Auto-validates menu items and pricing
- Integrates with order creation workflow
- Supports multiple payment gateways
