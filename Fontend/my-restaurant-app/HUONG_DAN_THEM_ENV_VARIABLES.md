# 🔧 Hướng Dẫn Thêm Environment Variables trên Vercel

## 📋 Các Bước Thêm Environment Variables

### Bước 1: Truy cập Vercel Dashboard
1. Vào trang: https://vercel.com/vinh-lois-projects/my-restaurant-app
2. Click vào tab **"Settings"** (trên thanh menu)

### Bước 2: Vào mục Environment Variables
1. Trong Settings, click vào **"Environment Variables"** (menu bên trái)

### Bước 3: Thêm từng biến môi trường

Click nút **"Add New"** và thêm từng biến sau:

#### 1. VITE_AUTH_API
- **Name:** `VITE_AUTH_API`
- **Value:** `https://your-auth-service.railway.app/api` (thay bằng URL thật từ Railway)
- **Environment:** Chọn cả 3: ✅ Production, ✅ Preview, ✅ Development
- Click **"Save"**

#### 2. VITE_CUSTOMER_API
- **Name:** `VITE_CUSTOMER_API`
- **Value:** `https://your-customer-service.railway.app/api`
- **Environment:** ✅ Production, ✅ Preview, ✅ Development
- Click **"Save"**

#### 3. VITE_MENU_API
- **Name:** `VITE_MENU_API`
- **Value:** `https://your-menu-service.railway.app/api`
- **Environment:** ✅ Production, ✅ Preview, ✅ Development
- Click **"Save"**

#### 4. VITE_INVENTORY_API
- **Name:** `VITE_INVENTORY_API`
- **Value:** `https://your-inventory-service.railway.app/api`
- **Environment:** ✅ Production, ✅ Preview, ✅ Development
- Click **"Save"**

#### 5. VITE_ORDER_API
- **Name:** `VITE_ORDER_API`
- **Value:** `https://your-order-service.railway.app/api`
- **Environment:** ✅ Production, ✅ Preview, ✅ Development
- Click **"Save"**

#### 6. VITE_TABLE_API
- **Name:** `VITE_TABLE_API`
- **Value:** `https://your-table-service.railway.app/api`
- **Environment:** ✅ Production, ✅ Preview, ✅ Development
- Click **"Save"**

#### 7. VITE_ORDER_SOCKET_URL
- **Name:** `VITE_ORDER_SOCKET_URL`
- **Value:** `https://your-order-service.railway.app` (KHÔNG có `/api` ở cuối)
- **Environment:** ✅ Production, ✅ Preview, ✅ Development
- Click **"Save"**

#### 8. VITE_TABLE_SOCKET_URL
- **Name:** `VITE_TABLE_SOCKET_URL`
- **Value:** `https://your-table-service.railway.app` (KHÔNG có `/api` ở cuối)
- **Environment:** ✅ Production, ✅ Preview, ✅ Development
- Click **"Save"**

### Bước 4: Redeploy sau khi thêm xong

Sau khi thêm tất cả biến môi trường:

1. Vào tab **"Deployments"** (trên thanh menu)
2. Tìm deployment mới nhất (ở đầu danh sách)
3. Click vào **"..."** (3 chấm) bên phải deployment
4. Chọn **"Redeploy"**
5. Xác nhận **"Redeploy"**

**Lưu ý:** Phải redeploy thì các biến môi trường mới có hiệu lực!

---

## 🚨 Nếu chưa có URLs từ Railway (tạm thời dùng localhost)

Nếu backend chưa deploy lên Railway, bạn có thể tạm thời dùng localhost để test:

```
VITE_AUTH_API=http://localhost:5000/api
VITE_CUSTOMER_API=http://localhost:5002/api
VITE_MENU_API=http://localhost:5003/api
VITE_INVENTORY_API=http://localhost:5004/api
VITE_ORDER_API=http://localhost:5005/api
VITE_TABLE_API=http://localhost:5006/api
VITE_ORDER_SOCKET_URL=http://localhost:5005
VITE_TABLE_SOCKET_URL=http://localhost:5006
```

**Lưu ý:** Với localhost, website trên Vercel sẽ KHÔNG thể gọi được API (vì localhost chỉ hoạt động trên máy của bạn).

---

## 📝 Checklist

- [ ] Đã truy cập Vercel Dashboard
- [ ] Đã vào Settings → Environment Variables
- [ ] Đã thêm tất cả 8 biến môi trường
- [ ] Đã chọn cả 3 environments (Production, Preview, Development)
- [ ] Đã redeploy sau khi thêm xong
- [ ] Đã test website hoạt động

---

## 🎯 Sau khi có URLs từ Railway

1. Vào lại **Settings → Environment Variables**
2. **Edit** từng biến
3. Thay giá trị localhost bằng URLs thật từ Railway
4. **Save**
5. **Redeploy** lại

---

## 💡 Mẹo

- Để xem logs khi deploy, vào **Deployments** → Click vào deployment → Tab **"Logs"**
- Để kiểm tra biến môi trường đã được set chưa, xem trong build logs
- Nếu có lỗi CORS, kiểm tra backend đã set `FRONTEND_URL` = URL Vercel chưa

