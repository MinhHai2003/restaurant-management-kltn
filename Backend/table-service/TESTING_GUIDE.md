# 📝 HƯỚNG DẪN TEST TABLE & RESERVATION API - TỪNG BƯỚC

## 🎯 MỤC TIÊU

Test đầy đủ hệ thống đặt bàn nhà hàng từ tìm kiếm bàn trống đến hoàn thành đặt chỗ.

---

## 📋 CHUẨN BỊ

1. ✅ Table Service đang chạy trên port 5006
2. ✅ Customer Service đang chạy trên port 5002
3. ✅ Có tài khoản customer để test

---

## 🚀 BƯỚC 1: KIỂM TRA HỆ THỐNG

### 1.1 Kiểm tra Table Service hoạt động

```powershell
Invoke-RestMethod -Uri "http://localhost:5006/health" -Method GET
```

**Kết quả mong đợi:** Status "OK", service "Table Service"

### 1.2 Xem danh sách tất cả bàn

```powershell
Invoke-RestMethod -Uri "http://localhost:5006/api/tables" -Method GET | ConvertTo-Json -Depth 3
```

**Kết quả mong đợi:** Danh sách 8 bàn (T001-T004, O001-O002, V001-V002)

---

## 🔍 BƯỚC 2: TÌM KIẾM BÀN TRỐNG

### 2.1 Tìm bàn cho 4 người vào tối mai (19:00-21:00)

```powershell
$searchParams = "date=2025-08-09&startTime=19:00&endTime=21:00&partySize=4"
Invoke-RestMethod -Uri "http://localhost:5006/api/tables/search?$searchParams" -Method GET | ConvertTo-Json -Depth 3
```

**Chú ý:** Xem giá `calculatedPrice` - sẽ cao hơn vào giờ peak và weekend

### 2.2 Tìm bàn VIP cho nhóm lớn

```powershell
$vipParams = "date=2025-08-09&startTime=18:00&endTime=22:00&partySize=8&location=private"
Invoke-RestMethod -Uri "http://localhost:5006/api/tables/search?$vipParams" -Method GET | ConvertTo-Json -Depth 3
```

### 2.3 Tìm bàn ngoài trời thân thiện với thú cưng

```powershell
$petParams = "date=2025-08-09&startTime=19:00&endTime=21:00&partySize=4&features=pet_friendly"
Invoke-RestMethod -Uri "http://localhost:5006/api/tables/search?$petParams" -Method GET | ConvertTo-Json -Depth 3
```

**📝 GHI CHÚ:** Copy một `tableId` từ kết quả search để dùng cho bước tiếp theo!

---

## 👤 BƯỚC 3: ĐĂNG NHẬP CUSTOMER

### 3.1 Đăng nhập để lấy token

```powershell
$loginData = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5002/api/customers/login" -Method POST -Body $loginData -ContentType "application/json"
$token = $loginResponse.data.token
Write-Host "Token: $token"
```

**📝 GHI CHÚ:** Copy token này để dùng cho các bước đặt bàn!

---

## 📅 BƯỚC 4: TẠO ĐẶT BÀN

### 4.1 Đặt bàn cho sinh nhật (thay YOUR_TOKEN và TABLE_ID)

```powershell
$token = "YOUR_TOKEN_HERE"  # Thay bằng token từ bước 3
$tableId = "YOUR_TABLE_ID"  # Thay bằng tableId từ bước 2

$reservationData = @{
    tableId = $tableId
    reservationDate = "2025-08-09"
    startTime = "19:00"
    endTime = "21:00"
    partySize = 4
    occasion = "birthday"
    specialRequests = "Window seat preferred, birthday cake setup"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$reservation = Invoke-RestMethod -Uri "http://localhost:5006/api/reservations" -Method POST -Body $reservationData -Headers $headers
$reservationNumber = $reservation.data.reservation.reservationNumber
Write-Host "Reservation Number: $reservationNumber"
```

**📝 GHI CHÚ:** Lưu `reservationNumber` để dùng cho các bước tiếp theo!

---

## 👀 BƯỚC 5: QUẢN LÝ ĐẶT BÀN

### 5.1 Xem tất cả đặt bàn của mình

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:5006/api/reservations" -Method GET -Headers $headers | ConvertTo-Json -Depth 3
```

### 5.2 Xem chi tiết đặt bàn cụ thể

```powershell
$reservationNumber = "YOUR_RESERVATION_NUMBER"  # Từ bước 4
Invoke-RestMethod -Uri "http://localhost:5006/api/reservations/$reservationNumber" -Method GET -Headers $headers | ConvertTo-Json -Depth 3
```

### 5.3 Xem chỉ đặt bàn sắp tới

```powershell
Invoke-RestMethod -Uri "http://localhost:5006/api/reservations?upcoming=true" -Method GET -Headers $headers | ConvertTo-Json -Depth 3
```

---

## ✏️ BƯỚC 6: SỬA ĐẶT BÀN

### 6.1 Thay đổi số lượng khách và yêu cầu đặc biệt

```powershell
$updateData = @{
    partySize = 6
    specialRequests = "Need high chair for baby, birthday cake setup, vegetarian options"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://localhost:5006/api/reservations/$reservationNumber" -Method PUT -Body $updateData -Headers $headers | ConvertTo-Json -Depth 3
```

---

## 📊 BƯỚC 7: XEM THỐNG KÊ

### 7.1 Thống kê bàn ăn tổng quan

```powershell
Invoke-RestMethod -Uri "http://localhost:5006/api/tables/stats" -Method GET | ConvertTo-Json -Depth 3
```

### 7.2 Thống kê đặt bàn cá nhân

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:5006/api/reservations/stats" -Method GET -Headers $headers | ConvertTo-Json -Depth 3
```

### 7.3 Xem lịch trống của một bàn cụ thể

```powershell
$tableId = "YOUR_TABLE_ID"  # Từ bước 2
$calendarParams = "tableId=$tableId&startDate=2025-08-09&endDate=2025-08-15"
Invoke-RestMethod -Uri "http://localhost:5006/api/tables/availability?$calendarParams" -Method GET | ConvertTo-Json -Depth 3
```

---

## ⭐ BƯỚC 8: ĐÁNH GIÁ DỊCH VỤ (SAU KHI DÙNG BỮA)

### 8.1 Đánh giá trải nghiệm

```powershell
$ratingData = @{
    service = 5
    ambiance = 4
    overall = 5
    comment = "Excellent service! The birthday setup was perfect and staff was very attentive."
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://localhost:5006/api/reservations/$reservationNumber/rate" -Method POST -Body $ratingData -Headers $headers | ConvertTo-Json -Depth 3
```

---

## ❌ BƯỚC 9: HỦY ĐẶT BÀN (NẾU CẦN)

### 9.1 Hủy đặt bàn với lý do

```powershell
$cancelData = @{
    reason = "Family emergency, cannot attend"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://localhost:5006/api/reservations/$reservationNumber" -Method DELETE -Body $cancelData -Headers $headers | ConvertTo-Json -Depth 3
```

---

## 🧪 BƯỚC 10: TEST CÁC TRƯỜNG HỢP LỖI

### 10.1 Test đặt bàn không có token (should fail)

```powershell
$invalidData = @{
    tableId = $tableId
    reservationDate = "2025-08-09"
    startTime = "19:00"
    endTime = "21:00"
    partySize = 4
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:5006/api/reservations" -Method POST -Body $invalidData -ContentType "application/json"
} catch {
    Write-Host "Expected Error: $($_.Exception.Message)"
}
```

### 10.2 Test tìm kiếm với ngày không hợp lệ (should fail)

```powershell
try {
    Invoke-RestMethod -Uri "http://localhost:5006/api/tables/search?date=invalid-date&startTime=19:00&endTime=21:00&partySize=4" -Method GET
} catch {
    Write-Host "Expected Error: $($_.Exception.Message)"
}
```

### 10.3 Test đặt bàn với số lượng khách quá lớn (should fail)

```powershell
$oversizeData = @{
    tableId = $tableId
    reservationDate = "2025-08-09"
    startTime = "19:00"
    endTime = "21:00"
    partySize = 25
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:5006/api/reservations" -Method POST -Body $oversizeData -Headers $headers
} catch {
    Write-Host "Expected Error: $($_.Exception.Message)"
}
```

---

## 📋 CHECKLIST HOÀN THÀNH

- [ ] **Bước 1**: Health check thành công
- [ ] **Bước 2**: Tìm kiếm bàn trống thành công
- [ ] **Bước 3**: Đăng nhập lấy token thành công
- [ ] **Bước 4**: Tạo đặt bàn thành công
- [ ] **Bước 5**: Xem danh sách đặt bàn thành công
- [ ] **Bước 6**: Sửa đặt bàn thành công
- [ ] **Bước 7**: Xem thống kê thành công
- [ ] **Bước 8**: Đánh giá dịch vụ thành công
- [ ] **Bước 9**: Hủy đặt bàn thành công (optional)
- [ ] **Bước 10**: Test error cases thành công

---

## 🎉 KẾT QUẢ MONG ĐỢI

Sau khi hoàn thành tất cả bước:

1. ✅ Hệ thống đặt bàn hoạt động hoàn chỉnh
2. ✅ Pricing tự động theo giờ cao điểm/weekend
3. ✅ Validation và error handling hoạt động đúng
4. ✅ Authentication và authorization secure
5. ✅ Customer có thể quản lý đặt bàn hiệu quả

---

## 📞 TROUBLESHOOTING

### Lỗi thường gặp:

- **401 Unauthorized**: Check token có đúng không
- **404 Not Found**: Check tableId/reservationNumber có tồn tại không
- **409 Conflict**: Bàn đã được đặt trong khung giờ này
- **400 Bad Request**: Check định dạng dữ liệu (date, time, partySize)

### Debug commands:

```powershell
# Check service status
Get-Process | Where-Object {$_.ProcessName -eq "node"}

# Check port usage
netstat -an | Select-String "5006"
```
