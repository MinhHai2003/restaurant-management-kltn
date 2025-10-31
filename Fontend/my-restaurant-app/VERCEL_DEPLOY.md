# 🚀 Hướng Dẫn Deploy Frontend lên Vercel - Chi Tiết Từng Bước

## 📋 Chuẩn bị trước khi deploy

### 1. Đảm bảo code đã sẵn sàng
- ✅ Đã commit tất cả thay đổi vào Git
- ✅ Đã push code lên GitHub repository
- ✅ Code không có lỗi TypeScript/ESLint

### 2. Chuẩn bị URLs từ Backend (Railway)
Bạn cần có URLs của các backend services từ Railway. Nếu chưa deploy backend, tạm thời dùng localhost, sau đó cập nhật lại.

## 🌐 Bước 1: Tạo Project trên Vercel

### 1.1. Đăng nhập Vercel
1. Vào https://vercel.com
2. Click **"Sign Up"** hoặc **"Log In"**
3. Chọn **"Continue with GitHub"** (khuyến khích)

### 1.2. Tạo Project mới
1. Sau khi đăng nhập, click **"+ New Project"** (góc trên bên phải)
2. Chọn repository của bạn từ danh sách
3. Nếu chưa thấy repo, click **"Import Git Repository"** → **"Add GitHub Account"** và cấp quyền

### 1.3. Cấu hình Project Settings

Trên màn hình **"Configure Project"**:

#### **Project Name**
- Đặt tên project (ví dụ: `restaurant-app`)

#### **Root Directory**
- Click **"Edit"** 
- Chọn: `Fontend/my-restaurant-app`
- Click **"Continue"**

#### **Framework Preset**
- Vercel tự động detect **Vite**, để nguyên

#### **Build and Output Settings**
- **Build Command**: `npm ci && npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`

**Lưu ý**: Nếu không thấy các trường này, click **"Show Advanced Options"**

## 🔧 Bước 2: Thêm Environment Variables

### 2.1. Trước khi deploy lần đầu

**QUAN TRỌNG**: Thêm environment variables TRƯỚC KHI click Deploy!

1. Scroll xuống phần **"Environment Variables"**
2. Thêm từng biến sau (chọn **Production**, **Preview**, và **Development**):

```
Name: VITE_AUTH_API
Value: http://localhost:5000/api
(Chọn cả 3: Production, Preview, Development)
```

```
Name: VITE_CUSTOMER_API
Value: http://localhost:5002/api
```

```
Name: VITE_MENU_API
Value: http://localhost:5003/api
```

```
Name: VITE_INVENTORY_API
Value: http://localhost:5004/api
```

```
Name: VITE_ORDER_API
Value: http://localhost:5005/api
```

```
Name: VITE_TABLE_API
Value: http://localhost:5006/api
```

```
Name: VITE_ORDER_SOCKET_URL
Value: http://localhost:5005
```

```
Name: VITE_TABLE_SOCKET_URL
Value: http://localhost:5006
```

### 2.2. Sau khi có URLs từ Railway

Sau khi deploy backend lên Railway và có URLs thật:

1. Vào Vercel Dashboard → Project của bạn
2. **Settings** → **Environment Variables**
3. **Edit** từng biến, thay `http://localhost:XXXX` bằng URLs thật:

```
VITE_AUTH_API → https://auth-service-production.up.railway.app/api
VITE_CUSTOMER_API → https://customer-service-production.up.railway.app/api
VITE_MENU_API → https://menu-service-production.up.railway.app/api
VITE_INVENTORY_API → https://inventory-service-production.up.railway.app/api
VITE_ORDER_API → https://order-service-production.up.railway.app/api
VITE_TABLE_API → https://table-service-production.up.railway.app/api
VITE_ORDER_SOCKET_URL → https://order-service-production.up.railway.app
VITE_TABLE_SOCKET_URL → https://table-service-production.up.railway.app
```

4. Sau khi cập nhật xong, vào **Deployments** → Click **"..."** trên deployment mới nhất → **Redeploy**

## 🚀 Bước 3: Deploy

### 3.1. Deploy lần đầu
1. Sau khi cấu hình xong, click nút **"Deploy"** (góc dưới bên phải)
2. Đợi quá trình build (thường mất 2-5 phút)
3. Xem log build trong real-time
4. Nếu build thành công, bạn sẽ thấy **"Congratulations! Your project has been deployed"**

### 3.2. Xem deployment
1. Click vào URL được cung cấp (ví dụ: `restaurant-app.vercel.app`)
2. Test xem site có chạy không

## 🔄 Bước 4: Cập nhật Environment Variables sau khi có Backend URLs

### 4.1. Lấy URLs từ Railway
1. Vào Railway Dashboard
2. Với mỗi service, copy **Public URL** (ví dụ: `https://auth-service-production.up.railway.app`)
3. Thêm `/api` vào cuối (trừ socket URLs)

### 4.2. Cập nhật trên Vercel
1. Vercel → Project → **Settings** → **Environment Variables**
2. **Edit** từng biến với URLs mới
3. **Redeploy** project

## 🌍 Bước 5: Gắn Custom Domain (Tùy chọn)

### 5.1. Thêm Domain
1. Vercel → Project → **Settings** → **Domains**
2. Nhập domain của bạn (ví dụ: `app.yourdomain.com`)
3. Click **"Add"**

### 5.2. Cấu hình DNS
Vercel sẽ hướng dẫn bạn thêm DNS records:
- Type: `CNAME` hoặc `A`
- Name: `app` (hoặc `@` cho root domain)
- Value: `cname.vercel-dns.com` (hoặc IP từ Vercel)

### 5.3. Đợi DNS propagate
- Thường mất 5-30 phút
- Kiểm tra bằng cách mở domain trong browser

## ✅ Bước 6: Kiểm tra Deployment

### 6.1. Kiểm tra Console
1. Mở site trên Vercel
2. Mở **Developer Tools** (F12)
3. Vào tab **Console**
4. Kiểm tra không có lỗi CORS hoặc 404

### 6.2. Test các chức năng
- ✅ Trang chủ load được
- ✅ Menu hiển thị sản phẩm
- ✅ Tìm kiếm hoạt động
- ✅ Đăng nhập/Đăng ký
- ✅ Giỏ hàng
- ✅ Đặt bàn

### 6.3. Kiểm tra Network
1. Developer Tools → **Network** tab
2. Reload page
3. Xem các request API:
   - Nếu thấy `localhost` → chưa cập nhật env variables đúng
   - Nếu thấy `CORS error` → backend chưa set `FRONTEND_URL` đúng

## 🐛 Troubleshooting

### Lỗi Build Failed
- Kiểm tra log build trên Vercel
- Thường do lỗi TypeScript → fix lỗi và push lại
- Hoặc do thiếu dependencies → kiểm tra `package.json`

### Lỗi 404 trên các routes
- Kiểm tra file `vercel.json` đã có
- Hoặc vào Vercel Settings → **Build & Development Settings** → **Output Directory**: `dist`

### Lỗi CORS
- Kiểm tra env variables đã đúng chưa
- Kiểm tra backend đã set `FRONTEND_URL` = URL Vercel chưa
- Redeploy cả frontend và backend

### Environment Variables không work
- Đảm bảo đã chọn đúng environment (Production/Preview/Development)
- Sau khi thêm/sửa env, phải **Redeploy**
- Kiểm tra tên biến bắt đầu bằng `VITE_`

## 📝 Checklist Tổng Kết

- [ ] Đã push code lên GitHub
- [ ] Đã tạo project trên Vercel
- [ ] Đã set Root Directory: `Fontend/my-restaurant-app`
- [ ] Đã thêm tất cả Environment Variables
- [ ] Đã deploy thành công
- [ ] Đã test site hoạt động
- [ ] Đã cập nhật env variables với Railway URLs (sau khi deploy backend)
- [ ] Đã redeploy sau khi cập nhật env
- [ ] Đã test lại sau khi cập nhật URLs

## 🎉 Hoàn thành!

Nếu mọi thứ đã chạy ổn, bạn đã deploy frontend thành công! 

Tiếp theo: Deploy backend lên Railway (xem `DEPLOYMENT_GUIDE.md`)

---

**Cần hỗ trợ?** Kiểm tra logs trên Vercel Dashboard → Deployments → Click vào deployment → Xem logs

