# 🏦 Cấu hình thông tin ngân hàng

## 📋 Tổng quan

Có 2 cách để cấu hình thông tin ngân hàng:

### ✅ Cách 1: Qua Casso.vn (Recommended - Tự động)

Thông tin ngân hàng được lấy **tự động** từ tài khoản Casso.vn của bạn:

1. Đăng nhập: https://app.casso.vn
2. Vào **Tài khoản ngân hàng** → **Thêm tài khoản**
3. Liên kết tài khoản ngân hàng của bạn
4. Casso sẽ tự động lấy:
   - Tên ngân hàng
   - Số tài khoản
   - Tên chủ tài khoản

**Không cần config gì thêm trong code!** Backend tự động lấy từ Casso API.

### ⚙️ Cách 2: Hardcode trong Frontend (Manual - Cho QRPayment.tsx)

Nếu bạn sử dụng component `QRPayment.tsx` (không qua Casso), chỉnh tại:

**File:** `src/components/QRPayment.tsx`

```tsx
// Dòng 25-30
const bankInfo = {
  bankName: 'Techcombank',           // ← Thay tên ngân hàng
  accountNumber: '19037987850010',   // ← Thay số tài khoản
  accountName: 'Nhà hàng hải sản',  // ← Thay tên chủ TK
  bankCode: 'TCB'                    // ← Thay mã ngân hàng
};
```

## 🏦 Mã ngân hàng VietQR

Component `CassoPayment.tsx` đã có **tự động mapping** từ tên ngân hàng ra mã, nhưng nếu cần thay đổi:

| Ngân hàng | Mã ngân hàng |
|-----------|--------------|
| Vietcombank | VCB |
| Techcombank | TCB |
| BIDV | BIDV |
| VietinBank | CTG |
| Agribank | AGR |
| MB Bank | MB |
| ACB | ACB |
| VPBank | VPB |
| Sacombank | STB |
| TPBank | TPB |
| HDBank | HDB |
| VIB | VIB |
| SHB | SHB |
| SeABank | SEAB |
| OCB | OCB |
| MSB | MSB |
| LienVietPostBank | LPB |
| SCB | SCB |

[Xem danh sách đầy đủ tại VietQR.io](https://vietqr.io/danh-sach-ngan-hang)

## 🔍 Kiểm tra thông tin ngân hàng

### Test với Casso API

```bash
curl -X GET https://oauth.casso.vn/v2/userInfo \
  -H "Authorization: Apikey YOUR_CASSO_API_KEY"
```

Response sẽ trả về danh sách tài khoản ngân hàng đã liên kết.

### Test Frontend Component

1. Tạo đơn hàng test
2. Chọn thanh toán "Chuyển khoản ngân hàng"
3. Kiểm tra thông tin hiển thị có đúng không

## 📝 Checklist

- [ ] Đã liên kết tài khoản ngân hàng trên Casso.vn
- [ ] Test API Casso trả về đúng thông tin
- [ ] QR code hiển thị đúng
- [ ] Thông tin STK, tên TK hiển thị đúng
- [ ] Nội dung chuyển khoản đúng format

## ⚠️ Lưu ý

1. **Bảo mật**: Không commit thông tin ngân hàng vào git
2. **Môi trường**: Dev và Production nên dùng tài khoản khác nhau
3. **QR Code**: Chỉ hoạt động nếu ngân hàng có trong danh sách VietQR

## 🆘 Troubleshooting

### QR code không hiển thị đúng

**Nguyên nhân**: Mã ngân hàng không đúng

**Giải pháp**: Kiểm tra tên ngân hàng trong Casso có match với mapping không

### Thông tin ngân hàng không load

**Nguyên nhân**: Casso API key không đúng hoặc chưa liên kết TK

**Giải pháp**:
1. Kiểm tra `.env` có `CASSO_API_KEY` đúng không
2. Vào Casso.vn kiểm tra đã liên kết ngân hàng chưa
3. Check server logs: `🔔 [CASSO]` messages

### Số tiền trong QR không đúng

**Nguyên nhân**: Amount bị format sai

**Giải pháp**: VietQR yêu cầu amount là số nguyên (không có phẩy, dấu chấm)

---

**Tóm lại:** Nếu dùng Casso.vn, bạn **không cần** config gì cả! Chỉ cần liên kết tài khoản trên Casso.

