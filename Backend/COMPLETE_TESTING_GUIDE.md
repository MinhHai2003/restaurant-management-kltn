# 🍽️ Restaurant Order System - Complete Testing Guide

## 📋 Overview

This guide covers testing all 3 order types:

- **🏃 PICKUP/TAKEAWAY**: Order food for pickup (no reservation needed)
- **🍽️ DINE-IN**: Reserve table + order food at restaurant
- **🚚 DELIVERY**: Order food for home delivery

## 🚀 Quick Setup

### 1. Import to Postman

1. Open Postman
2. Click **Import**
3. Import these files:
   - `Restaurant_Order_System_Complete.postman_collection.json`
   - `Restaurant_Order_System.postman_environment.json`
4. Select the **Restaurant Order System Environment**

### 2. Start Services

```bash
# Terminal 1: Customer Service
cd customer-service
node index.js

# Terminal 2: Table Service
cd table-service
node index.js

# Terminal 3: Order Service
cd order-service
node index.js
```

### 3. Verify Health

Run all requests in **🛠️ Health Checks** folder to ensure services are running.

## 🧪 Testing Workflows

### 🔐 Authentication (Required First)

1. **Login Customer** - This saves the `accessToken` automatically
2. **Get Customer Profile** - Verify login worked

### 🏃 Testing PICKUP/TAKEAWAY Flow

**Scenario**: Customer calls restaurant to order food for pickup

1. **Create Pickup Order**

   - Customer orders Phở + Chả cá
   - Scheduled pickup at 7:30 PM
   - System saves `pickupOrderNumber`

2. **Get All Pickup Orders (Staff View)**

   - Staff sees all pickup orders for today
   - Filter by status: `pending`, `ready`, `completed`

3. **Mark Pickup Order as Ready**

   - Kitchen finishes cooking
   - Staff marks order as ready
   - Customer gets notification (simulated)

4. **Complete Pickup**
   - Customer arrives and pays
   - Staff marks as picked up
   - Order completed

**Status Flow**: `pending → confirmed → preparing → ready → picked_up → completed`

### 🍽️ Testing DINE-IN Flow

**Scenario**: Customer wants to dine at restaurant with table reservation

1. **Get Available Tables**

   - Find tables for 4 people, indoor location
   - System saves `tableId` automatically

2. **Create Reservation**

   - Reserve table for tonight 7-9 PM
   - Birthday occasion with special requests
   - System saves `reservationNumber`

3. **Check-in at Restaurant**

   - Customer arrives and checks in
   - Table status becomes "occupied"
   - Reservation status becomes "seated"

4. **Order Food at Table**

   - Customer orders Gỏi cuốn + Bún bò Huế + Bánh flan
   - System saves `dineInOrderNumber`
   - Includes service charge (10%)

5. **Kitchen: Start Cooking**

   - Kitchen receives order
   - Status becomes "cooking"

6. **Waiter: Serve Food**

   - Food ready, waiter serves
   - Status becomes "served"

7. **Get Orders for Reservation**

   - View all orders for this table/reservation

8. **Complete Order**

   - Customer finishes eating
   - Status becomes "completed"

9. **Check-out from Restaurant**
   - Customer leaves
   - Table becomes "available"
   - Reservation becomes "completed"

**Status Flow**: `ordered → cooking → served → dining → completed`

### 🚚 Testing DELIVERY Flow

**Scenario**: Customer orders food for home delivery

1. **Create Delivery Order**
   - Customer orders Cơm tấm + Trà sữa
   - Provide delivery address
   - Includes delivery fee

**Status Flow**: `pending → confirmed → preparing → ready → out_for_delivery → delivered → completed`

## 📊 Analytics & Management

Test these endpoints to view data:

1. **Customer Order History** - All orders by customer
2. **Customer Reservations** - All reservations by customer
3. **Table Service Stats** - Reservation statistics

## 🔄 Variable Auto-Save

The collection automatically saves important IDs:

- `accessToken` - From login
- `tableId` - From available tables
- `reservationNumber` - From reservation creation
- `pickupOrderNumber` - From pickup order
- `dineInOrderNumber` - From dine-in order

## 🧪 Test Scenarios

### Scenario 1: Busy Friday Night

1. Customer makes reservation for 8 PM
2. Arrives at 7:45 PM (early check-in)
3. Orders multiple items at table
4. Kitchen workflow: cooking → served
5. Customer dines → pays → leaves

### Scenario 2: Quick Lunch Pickup

1. Customer calls for pickup order
2. Orders ready in 20 minutes
3. Customer arrives and pays
4. Takes food and leaves

### Scenario 3: Family Delivery Order

1. Family orders dinner for delivery
2. Large order with special instructions
3. Driver delivers to home
4. Order completed

## ⚠️ Error Testing

Try these to test error handling:

- Login with wrong credentials
- Create reservation for past date
- Check-in too early/late
- Order at table without reservation
- Mark non-existent order as ready

## 📝 Expected Results

### Successful Pickup Order:

```json
{
  "success": true,
  "message": "Pickup order created successfully",
  "data": {
    "order": {
      "orderNumber": "PKP-1723220123456-789",
      "status": "pending",
      "estimatedTime": 20,
      "scheduledPickupTime": "2025-08-09T19:30:00Z",
      "pricing": {
        "subtotal": 290000,
        "tax": 23200,
        "total": 313200
      }
    }
  }
}
```

### Successful Dine-in Order:

```json
{
  "success": true,
  "message": "Dine-in order created successfully",
  "data": {
    "order": {
      "orderNumber": "ORD-1723220123456-890",
      "status": "ordered",
      "estimatedTime": 30,
      "pricing": {
        "subtotal": 425000,
        "serviceCharge": 42500,
        "total": 467500
      }
    }
  }
}
```

## 🔧 Troubleshooting

### Common Issues:

1. **Services not running**

   - Check health endpoints first
   - Verify ports 5002, 5005, 5006 are free

2. **Authentication failed**

   - Run login request first
   - Check if token was saved to variables

3. **Reservation creation failed**

   - Ensure customer has phone number
   - Check table availability

4. **Order creation failed**
   - Verify reservation exists and is checked-in
   - Check menu item IDs are valid

## 📞 Support

If you encounter issues:

1. Check service logs in terminals
2. Verify database connections
3. Ensure all required fields are provided
4. Check variable values in Postman

Happy testing! 🚀
