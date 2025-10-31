# ✅ Kiểm tra Env Variables trên Vercel

## Vấn đề
Frontend vẫn gọi `localhost:5002` → Env variables có thể chưa được set hoặc build chưa áp dụng.

## Các bước kiểm tra NGAY

### 1. Kiểm tra Env Variables trên Vercel

1. Vào https://vercel.com → Đăng nhập
2. Chọn project `my-restaurant-app`
3. Vào **Settings** (bên trái)
4. Click **Environment Variables**
5. Kiểm tra các biến sau:

#### ✅ Phải có EXACTLY như sau:

| Key | Value |
|-----|-------|
| `VITE_CUSTOMER_API` | `https://customer-service-production-ec02.up.railway.app/api` |
| `VITE_AUTH_API` | `https://auth-service-production-9de6.up.railway.app/api` |
| `VITE_MENU_API` | `https://menu-service-production-0211.up.railway.app/api` |

#### ⚠️ Lưu ý:
- ✅ Tên biến phải **CHÍNH XÁC** (case-sensitive): `VITE_CUSTOMER_API` (không phải `VITE_customer_api`)
- ✅ Giá trị phải **CHÍNH XÁC**: có `https://`, có `/api` ở cuối
- ✅ Không có space thừa ở đầu/cuối
- ✅ Phải được set cho môi trường **Production** (có thể thêm Preview và Development nếu cần)

### 2. Nếu chưa có hoặc sai → Sửa NGAY:

1. Nếu chưa có → Click **Add New** → Nhập key và value
2. Nếu đã có nhưng sai → Click **Edit** → Sửa value
3. **SAU KHI SỬA** → Phải redeploy (xem bước 3)

### 3. Redeploy (BẮT BUỘC sau khi sửa env)

1. Vào tab **Deployments**
2. Click vào deployment mới nhất (màu xanh "Ready")
3. Click **⋮** (3 chấm) → **Redeploy**
4. **QUAN TRỌNG**: BỎ CHỌN checkbox "Use existing Build Cache"
5. Click **Redeploy**
6. Đợi 2-3 phút

### 4. Kiểm tra sau khi deploy

1. Sau khi deploy xong (status = "Ready")
2. Vào https://my-restaurant-app-six.vercel.app
3. Mở DevTools (F12) → **Console** tab
4. Đăng nhập vào tài khoản
5. Vào trang "Thông tin tài khoản"
6. Xem console logs:

**Nếu thấy:**
```
🔍 [PROFILE] ENV Variables: {
  VITE_CUSTOMER_API: "https://customer-service-production-ec02.up.railway.app/api",
  ...
}
🔍 [PROFILE] Fetching from: https://customer-service-production-ec02.up.railway.app/api/customers/profile
```
→ ✅ **ĐÚNG!** Env variables đã được inject

**Nếu thấy:**
```
🔍 [PROFILE] ENV Variables: {
  VITE_CUSTOMER_API: undefined,
  ...
}
🔍 [PROFILE] Fetching from: http://localhost:5002/api/customers/profile
```
→ ❌ **SAI!** Env variables chưa được set hoặc build đang dùng cache cũ

### 5. Nếu vẫn sai sau khi redeploy

#### Kiểm tra build logs:
1. Vào deployment → **Build Logs** tab
2. Tìm dòng có `VITE_CUSTOMER_API`
3. Xem giá trị được inject vào build

#### Nếu logs không có env variables:
- Env variables chưa được set trên Vercel
- Hoặc set cho môi trường sai (Preview thay vì Production)

#### Nếu logs có env variables nhưng app vẫn dùng localhost:
- Browser đang cache build cũ → Clear cache (Ctrl+Shift+R)
- Hoặc build cache chưa được clear → Redeploy lại với cache OFF

## Checklist

- [ ] Đã kiểm tra env variables trên Vercel Settings
- [ ] Tất cả 3 biến (`VITE_CUSTOMER_API`, `VITE_AUTH_API`, `VITE_MENU_API`) đều có và đúng
- [ ] Đã redeploy với "Use existing Build Cache" = OFF
- [ ] Đã đợi deploy xong (status = "Ready")
- [ ] Đã clear browser cache (Ctrl+Shift+R)
- [ ] Đã kiểm tra console logs và thấy env variables đúng

## Nếu vẫn không được

Kiểm tra lại:
1. Tên project trên Vercel đúng chưa?
2. Env variables được set cho environment nào? (Production/Preview/Development)
3. Có nhiều project trên Vercel không? Có thể đang kiểm tra sai project?

