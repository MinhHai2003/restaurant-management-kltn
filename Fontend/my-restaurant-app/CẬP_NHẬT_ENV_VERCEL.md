# 🔧 CẬP NHẬT ENVIRONMENT VARIABLES TRÊN VERCEL

## 🚨 VẤN ĐỀ HIỆN TẠI:
- Frontend đang dùng URL placeholder: `https://your-menu-service.railway.app`
- Cần cập nhật thành URL thật của Railway services

## 📋 CÁC URL RAILWAY ĐÃ DEPLOY:

### ✅ Đã deploy thành công:
1. **Auth Service**: `https://auth-service-production-9de6.up.railway.app`
2. **Customer Service**: `https://customer-service-production-ec02.up.railway.app`
3. **Menu Service**: `https://menu-service-production-0211.up.railway.app`

## 🔧 CẬP NHẬT TRÊN VERCEL:

### Bước 1: Truy cập Vercel Dashboard
1. Vào: https://vercel.com/vinh-lois-projects/my-restaurant-app/settings/environment-variables
2. Hoặc: Vercel Dashboard → Project → Settings → Environment Variables

### Bước 2: Cập nhật các biến sau:

#### 1. VITE_AUTH_API
```
Name: VITE_AUTH_API
Value: https://auth-service-production-9de6.up.railway.app/api
Environment: ✅ Production, ✅ Preview, ✅ Development
```

#### 2. VITE_CUSTOMER_API
```
Name: VITE_CUSTOMER_API
Value: https://customer-service-production-ec02.up.railway.app/api
Environment: ✅ Production, ✅ Preview, ✅ Development
```

#### 3. VITE_MENU_API ⚠️ QUAN TRỌNG
```
Name: VITE_MENU_API
Value: https://menu-service-production-0211.up.railway.app/api
Environment: ✅ Production, ✅ Preview, ✅ Development
```

### Bước 3: Nếu chưa có, thêm các biến sau:
- VITE_INVENTORY_API: (sẽ thêm sau khi deploy)
- VITE_ORDER_API: (sẽ thêm sau khi deploy)
- VITE_TABLE_API: (sẽ thêm sau khi deploy)
- VITE_ORDER_SOCKET_URL: (sẽ thêm sau khi deploy)
- VITE_TABLE_SOCKET_URL: (sẽ thêm sau khi deploy)

### Bước 4: Redeploy
Sau khi cập nhật xong:
1. Vào tab **"Deployments"**
2. Tìm deployment mới nhất
3. Click **"..."** → **"Redeploy"**
4. Chọn **"Redeploy"**

---

## ✅ SAU KHI CẬP NHẬT:
- Frontend sẽ sử dụng URL đúng của Railway
- CORS sẽ hoạt động (backend đã được cấu hình)
- Menu sẽ load được từ API

---

## 📝 GHI CHÚ:
- URL frontend của bạn: `https://my-restaurant-app-six.vercel.app`
- Backend đã được cấu hình CORS để cho phép URL này
- Chỉ cần cập nhật env variables trên Vercel là xong!

