# 🚀 Hướng Dẫn Deploy Restaurant Management System

## ✅ Bước 1: Cấu hình Frontend đã xong

Tất cả các service đã được cập nhật để dùng environment variables. File config trung tâm: `src/config/api.ts`

## 📋 Bước 2: Tạo file .env.local (cho development)

Tạo file `.env.local` trong thư mục `Fontend/my-restaurant-app/` với nội dung:

```env
VITE_AUTH_API=http://localhost:5000/api
VITE_CUSTOMER_API=http://localhost:5002/api
VITE_MENU_API=http://localhost:5003/api
VITE_INVENTORY_API=http://localhost:5004/api
VITE_ORDER_API=http://localhost:5005/api
VITE_TABLE_API=http://localhost:5006/api
```

## 🌐 Bước 3: Deploy Frontend lên Vercel

### 3.1. Tạo project trên Vercel
1. Vào https://vercel.com
2. Đăng nhập bằng GitHub
3. Click **"New Project"**
4. Import repository của bạn
5. **Root Directory**: Chọn `Fontend/my-restaurant-app`

### 3.2. Cấu hình Build
- **Framework Preset**: Vite
- **Build Command**: `npm ci && npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`

### 3.3. Thêm Environment Variables
Vào **Settings → Environment Variables**, thêm các biến sau (Production):

```env
VITE_AUTH_API=https://auth-api-production.up.railway.app/api
VITE_CUSTOMER_API=https://customer-api-production.up.railway.app/api
VITE_MENU_API=https://menu-api-production.up.railway.app/api
VITE_INVENTORY_API=https://inventory-api-production.up.railway.app/api
VITE_ORDER_API=https://order-api-production.up.railway.app/api
VITE_TABLE_API=https://table-api-production.up.railway.app/api
```

**Lưu ý**: Thay các URL trên bằng URL thật từ Railway sau khi deploy backend.

### 3.4. Deploy
Click **"Deploy"** và đợi build xong.

## 🚂 Bước 4: Deploy Backend lên Railway

### 4.1. Tạo MongoDB Atlas Cluster (nếu chưa có)
1. Vào https://www.mongodb.com/cloud/atlas
2. Tạo cluster free
3. Tạo database user
4. Whitelist IP: `0.0.0.0/0` (cho phép tất cả)
5. Copy connection string: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`

### 4.2. Deploy từng service lên Railway

Với **mỗi service**, làm các bước sau:

#### Auth Service
1. Railway → **New Project** → **Deploy from GitHub repo**
2. **Root Directory**: `Backend/auth-service`
3. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://loivinh759:602057Aa@cluster0.228w4d1.mongodb.net/restaurant-auth?retryWrites=true&w=majority
   FRONTEND_URL=https://your-vercel-app.vercel.app
   JWT_SECRET=supersecretkey
   ```
4. **Build Command**: `npm ci`
5. **Start Command**: `npm run start`
6. Railway sẽ tự động deploy và tạo public URL
7. Copy URL (ví dụ: `https://auth-service-production.up.railway.app`)

#### Customer Service
1. Tạo service mới, Root Directory: `Backend/customer-service`
2. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=5002
   MONGODB_URI=mongodb+srv://loivinh759:602057Aa@cluster0.228w4d1.mongodb.net/restaurant-customer?retryWrites=true&w=majority
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

#### Menu Service
1. Root Directory: `Backend/menu-service`
2. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=5003
   MONGODB_URI=mongodb+srv://loivinh759:602057Aa@cluster0.228w4d1.mongodb.net/restaurant-menu?retryWrites=true&w=majority
   FRONTEND_URL=https://your-vercel-app.vercel.app
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

#### Inventory Service
1. Root Directory: `Backend/inventory-service`
2. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=5004
   MONGODB_URI=mongodb+srv://loivinh759:602057Aa@cluster0.228w4d1.mongodb.net/restaurant-inventory?retryWrites=true&w=majority
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

#### Order Service
1. Root Directory: `Backend/order-service`
2. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=5005
   MONGODB_URI=mongodb+srv://loivinh759:602057Aa@cluster0.228w4d1.mongodb.net/restaurant-order?retryWrites=true&w=majority
   FRONTEND_URL=https://your-vercel-app.vercel.app
   JWT_SECRET=supersecretkey
   ```

#### Table Service
1. Root Directory: `Backend/table-service`
2. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=5006
   MONGODB_URI=mongodb+srv://loivinh759:602057Aa@cluster0.228w4d1.mongodb.net/restaurant-table?retryWrites=true&w=majority
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

### 4.3. Gắn Custom Domain (tùy chọn)
- Mỗi service trên Railway → **Settings → Domains**
- Thêm custom domain (ví dụ: `auth-api.yourdomain.com`)
- Railway sẽ cung cấp DNS records để bạn thêm vào domain provider

## 🔄 Bước 5: Cập nhật Frontend với Backend URLs

Sau khi có URLs từ Railway:
1. Vào Vercel → Project → **Settings → Environment Variables**
2. Cập nhật tất cả `VITE_*_API` với URLs thật từ Railway
3. Click **"Redeploy"**

## ✅ Bước 6: Kiểm tra

1. Mở frontend URL trên Vercel
2. Kiểm tra console không có lỗi CORS
3. Test đăng nhập/đăng ký
4. Test xem menu, giỏ hàng
5. Test đặt bàn

## 📝 Lưu ý quan trọng

1. **CORS**: Tất cả backend services phải có `FRONTEND_URL` đúng domain của Vercel
2. **Socket.io**: Đảm bảo Railway hỗ trợ WebSocket (Railway hỗ trợ mặc định)
3. **MongoDB**: Có thể dùng 1 database cho tất cả hoặc tách riêng mỗi service
4. **Environment Variables**: Railway sẽ tự động set `PORT`, không cần set thủ công

## 🆘 Troubleshooting

### Lỗi CORS
- Kiểm tra `FRONTEND_URL` trong backend đúng với domain Vercel
- Kiểm tra credentials trong CORS config

### Socket không kết nối
- Kiểm tra `VITE_ORDER_SOCKET_URL` và `VITE_TABLE_SOCKET_URL` đúng
- Đảm bảo Railway đã deploy xong

### 404 trên các routes
- Kiểm tra Vercel routing config (vite.config.ts đã đúng)

---

**Chúc bạn deploy thành công! 🎉**

