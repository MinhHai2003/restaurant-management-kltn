# 🔴 URGENT: Cập nhật Environment Variables trên Vercel

## Vấn đề hiện tại
Frontend trên Vercel vẫn đang gọi `localhost:5002` thay vì Railway URLs, gây ra lỗi CORS và không fetch được dữ liệu.

## Giải pháp

### Bước 1: Đăng nhập vào Vercel Dashboard
1. Vào https://vercel.com
2. Chọn project `my-restaurant-app` (hoặc tên project của bạn)

### Bước 2: Cập nhật Environment Variables
Vào **Settings** → **Environment Variables**, thêm/cập nhật các biến sau:

#### Các biến CẦN THIẾT:

```bash
VITE_CUSTOMER_API=https://customer-service-production-ec02.up.railway.app/api
VITE_AUTH_API=https://auth-service-production-9de6.up.railway.app/api
VITE_MENU_API=https://menu-service-production-0211.up.railway.app/api
```

#### Các biến cho các service chưa deploy (tạm thời để localhost, sẽ cập nhật sau):

```bash
VITE_INVENTORY_API=http://localhost:5004/api
VITE_ORDER_API=http://localhost:5005/api
VITE_TABLE_API=http://localhost:5006/api
VITE_SOCKET_URL=http://localhost:5000
VITE_ORDER_SOCKET_URL=http://localhost:5005
VITE_TABLE_SOCKET_URL=http://localhost:5006
```

### Bước 3: Push code lên GitHub TRƯỚC (QUAN TRỌNG! ⚠️)

**⚠️ LƯU Ý QUAN TRỌNG**: Code đã được sửa (ProfilePage, AddressesPage, ReservationsPage, reviewService) để dùng env variables thay vì localhost. Nhưng các thay đổi này chỉ có trên máy local của bạn, **chưa có trên GitHub**.

**Vercel build từ code trên GitHub**, không phải từ máy local của bạn. Vì vậy:

1. **PHẢI push code lên GitHub trước:**
   ```bash
   cd Fontend/my-restaurant-app
   git add .
   git commit -m "Fix: Replace hardcoded localhost URLs with env variables"
   git push
   ```

2. **Sau khi push, Vercel sẽ tự động deploy** với:
   - ✅ Code mới (đã sửa localhost URLs)
   - ✅ Env variables mới (sẽ được áp dụng khi build)

3. **Hoặc nếu muốn deploy ngay:**
   - Vercel sẽ tự động trigger deploy khi push lên GitHub
   - Hoặc vào Vercel Dashboard → Deployments → sẽ thấy deployment mới đang build

### Bước 4: Redeploy (nếu cần)

**CHỈ CẦN REDEPLOY NẾU:**
- Bạn đã push code rồi nhưng muốn rebuild với env variables mới
- Hoặc muốn rebuild deployment cũ với env variables mới (nhưng code cũ, không khuyến khích)

#### Cách redeploy từ Dashboard:
1. Vào tab **Deployments** trong Vercel Dashboard
2. Click vào deployment mới nhất (có màu xanh "Ready")
3. Click vào nút **⋮** (3 chấm dọc) ở góc phải trên cùng
4. Chọn **Redeploy**
5. Trong popup:
   - ✅ Bỏ chọn **Use existing Build Cache** (QUAN TRỌNG: để build lại với env mới)
   - Click **Redeploy**
6. Đợi 2-3 phút để build xong

**TL;DR: Push code lên GitHub → Vercel tự động deploy với code mới + env variables mới**

### Bước 4: Kiểm tra
Sau khi redeploy xong, kiểm tra:
1. Mở https://my-restaurant-app-six.vercel.app
2. Mở DevTools (F12) → Network tab
3. Đăng nhập vào tài khoản
4. Vào trang "Thông tin tài khoản"
5. Kiểm tra xem có còn gọi `localhost:5002` không

## Lưu ý
- ✅ Đã sửa code để dùng environment variables
- ✅ CORS đã được cấu hình trên customer-service
- ⚠️ Cần redeploy sau khi cập nhật env variables
- ⚠️ Cần đợi 2-3 phút để build xong

## Railway URLs hiện tại:
- **Auth Service**: `https://auth-service-production-9de6.up.railway.app`
- **Customer Service**: `https://customer-service-production-ec02.up.railway.app`
- **Menu Service**: `https://menu-service-production-0211.up.railway.app`

