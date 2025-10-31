# 🚨 FIX NGAY: Env Variables không hoạt động

## Vấn đề
Frontend vẫn gọi `localhost:5002` → Env variables chưa được inject vào build.

## KIỂM TRA NGAY

### 1. Console có hiển thị debug logs không?

Mở DevTools → Console, tìm xem có dòng này không:
```
🔍 [PROFILE] ENV Variables: { ... }
```

**Nếu KHÔNG có** → Code debug logs chưa được deploy → Cần push code

**Nếu CÓ** → Xem giá trị `VITE_CUSTOMER_API`:
- `undefined` → Env variables chưa được set trên Vercel
- Có giá trị đúng → Vấn đề khác

### 2. Kiểm tra Env Variables trên Vercel

1. Vào **Vercel Dashboard** → Project của bạn
2. **Settings** → **Environment Variables**
3. Kiểm tra:

#### ⚠️ QUAN TRỌNG: Phải set cho đúng Environment

Khi thêm env variable, bạn sẽ thấy 3 checkbox:
- ☐ Production
- ☐ Preview  
- ☐ Development

**PHẢI CHỌN "Production"** (và có thể chọn cả 3 để an toàn)

#### Danh sách env variables cần có:

```
VITE_CUSTOMER_API = https://customer-service-production-ec02.up.railway.app/api
VITE_AUTH_API = https://auth-service-production-9de6.up.railway.app/api
VITE_MENU_API = https://menu-service-production-0211.up.railway.app/api
```

### 3. Nếu đã set env variables → Redeploy BẮT BUỘC

**SAU KHI SỬA env variables, PHẢI redeploy:**

1. **Deployments** tab
2. Click vào deployment mới nhất
3. **⋮** → **Redeploy**
4. ⚠️ **BỎ CHỌN** "Use existing Build Cache" (QUAN TRỌNG!)
5. Click **Redeploy**
6. Đợi 2-3 phút

## Checklist Debug

- [ ] Console có hiển thị `🔍 [PROFILE] ENV Variables` không?
- [ ] Nếu có, giá trị `VITE_CUSTOMER_API` là gì? (`undefined` hay có URL?)
- [ ] Đã kiểm tra Vercel Settings → Environment Variables chưa?
- [ ] Env variables có được set cho "Production" không?
- [ ] Đã redeploy sau khi sửa env variables chưa?
- [ ] Khi redeploy, có BỎ CHỌN "Use existing Build Cache" không?
- [ ] Đã clear browser cache (Ctrl+Shift+R) chưa?

## Giải pháp theo từng trường hợp

### Trường hợp 1: Console KHÔNG có debug logs
→ Code debug logs chưa được push/deploy
→ **Giải pháp:** Push code và đợi Vercel auto-deploy

### Trường hợp 2: Console có logs nhưng `VITE_CUSTOMER_API = undefined`
→ Env variables chưa được set trên Vercel
→ **Giải pháp:** 
1. Vào Vercel Settings → Environment Variables
2. Thêm 3 biến như trên
3. Đảm bảo chọn "Production"
4. Redeploy với cache OFF

### Trường hợp 3: Console có logs và `VITE_CUSTOMER_API` có giá trị đúng
→ Env variables đã đúng, nhưng code vẫn dùng fallback
→ **Giải pháp:** Kiểm tra code logic (có thể có bug)

## Test sau khi fix

1. Vào trang profile
2. Mở Console (F12)
3. Phải thấy:
   ```
   🔍 [PROFILE] ENV Variables: {
     VITE_CUSTOMER_API: "https://customer-service-production-ec02.up.railway.app/api",
     ...
   }
   🔍 [PROFILE] Fetching from: https://customer-service-production-ec02.up.railway.app/api/customers/profile
   ```
4. Network tab → phải thấy request đến Railway URL, KHÔNG phải localhost

## Lưu ý quan trọng

⚠️ **Vercel chỉ inject env variables khi:**
- Env variables được set **TRƯỚC KHI** build
- Build được trigger **SAU KHI** set env variables
- Build **KHÔNG dùng cache** (cache OFF)

💡 **Tip:** Sau khi set/sửa env variables, LUÔN redeploy với "Use existing Build Cache" = OFF

