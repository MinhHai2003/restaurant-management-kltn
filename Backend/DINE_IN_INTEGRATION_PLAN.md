// ✅ ENHANCEMENT: Order Model để support tất cả loại đơn hàng

// 1. Phân loại đơn hàng:
// a) DELIVERY: Giao hàng tận nơi (existing)
// b) PICKUP/TAKEAWAY: Gọi món mang về, không đặt bàn (existing)  
// c) DINE_IN: Đặt bàn + ăn tại quán (new)

// 2. Thêm fields vào Order Model
{
// ... existing fields ...

delivery: {
type: {
type: String,
enum: ["delivery", "pickup", "dine_in"], // 3 loại rõ ràng
default: "delivery"
},

    // Cho DELIVERY
    address: {
      full: String,
      district: String,
      city: String,
      coordinates: { lat: Number, lng: Number }
    },
    driverId: ObjectId,
    fee: Number,

    // Cho PICKUP - thông tin lấy hàng
    pickupInfo: {
      customerName: String,
      phoneNumber: String,
      scheduledTime: Date, // Thời gian hẹn lấy
      instructions: String // "Gọi khi đến", "Lấy tại quầy"
    },

    // Cho DINE_IN - thông tin bàn ăn
    diningInfo: {
      reservationId: ObjectId,
      reservationNumber: String,
      tableInfo: {
        tableId: ObjectId,
        tableNumber: String,
        location: String
      },
      serviceType: {
        type: String,
        enum: ["self_service", "table_service"],
        default: "table_service"
      }
    }

}
}

// 3. Status flows cho từng loại:

// 🚚 DELIVERY Flow:
"pending" → "confirmed" → "preparing" → "ready" → "picked_up" → "out_for_delivery" → "delivered" → "completed"

// 🏃 PICKUP/TAKEAWAY Flow:  
"pending" → "confirmed" → "preparing" → "ready" → "picked_up" → "completed"

// �️ DINE_IN Flow:
"pending" → "confirmed" → "preparing" → "served" → "dining" → "completed"

// 4. Workflows:

// === A. PICKUP/TAKEAWAY (Không cần reservation) ===
// Step 1: Khách gọi món mang về
POST /api/orders
{
"delivery": {
"type": "pickup",
"pickupInfo": {
"customerName": "Nguyen Van A",
"phoneNumber": "0123456789",
"scheduledTime": "2025-08-09T19:30:00Z",
"instructions": "Gọi khi đến quầy"
}
},
"items": [...]
}
// → Status: "pending" → "confirmed" → "preparing" → "ready"
// → SMS/call khách: "Đơn hàng đã sẵn sàng, vui lòng đến lấy"
// → Khách đến lấy: Status = "picked_up" → "completed"

// === B. DINE_IN (Cần reservation) ===
// Step 1: Đặt bàn trước
POST /api/reservations {...}

// Step 2: Checkin khi đến quán  
POST /api/reservations/{id}/checkin

// Step 3: Đặt món tại bàn
POST /api/orders/dine-in
{
"delivery": {
"type": "dine_in",
"diningInfo": {
"reservationId": "...",
"reservationNumber": "RSV-..."
}
},
"items": [...]
}

// Step 4: Bếp nấu → phục vụ → khách ăn → checkout

// === C. DELIVERY (Existing) ===
// Giữ nguyên workflow hiện tại

// Step 1: Khách đặt bàn (Table Service)
POST /api/reservations
// → Tạo reservation với status "confirmed"

// Step 2: Khách đến và ngồi bàn (Table Service)  
PUT /api/reservations/{id}/checkin
// → Update reservation status = "seated"
// → Update table status = "occupied"

// Step 3: Khách đặt món (Order Service)
POST /api/orders
{
"diningInfo": {
"type": "dine_in",
"reservationId": "66b52c0aef2f8f0a2f1234a1",
"reservationNumber": "RSV-20250809-123456"
},
"items": [...]
}
// → Tạo order với status "ordered"
// → Order Service call Table Service để verify reservation

// Step 4: Bếp nấu món
PUT /api/orders/{id}/status
{ "status": "cooking" }

// Step 5: Phục vụ món ăn
PUT /api/orders/{id}/status  
{ "status": "served" }

// Step 6: Khách ăn xong và thanh toán
PUT /api/orders/{id}/status
{ "status": "completed" }

// Step 7: Khách rời bàn (Table Service)
PUT /api/reservations/{id}/checkout
// → Update reservation status = "completed"
// → Update table status = "available"

// 3. API endpoints cần thêm:

// Table Service:
PUT /api/reservations/{id}/checkin // Khách đến ngồi bàn
PUT /api/reservations/{id}/checkout // Khách rời bàn
GET /api/reservations/{id}/orders // Lấy tất cả orders của reservation

// Order Service:
POST /api/orders/dine-in // Tạo order cho dine-in
GET /api/orders/table/{tableId} // Lấy orders của bàn cụ thể
PUT /api/orders/{id}/serve // Đánh dấu đã phục vụ

// 4. Inter-service communication:
// Order Service → Table Service: Verify reservation exists
// Table Service → Order Service: Get orders for reservation
