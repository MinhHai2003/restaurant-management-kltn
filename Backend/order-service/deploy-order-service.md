# Deploy Order Service lên Railway

## ✅ Đã hoàn thành:
1. ✅ Sửa CORS và trust proxy trong `index.js`
2. ✅ Tạo Railway project: `order-service`
3. ✅ Link service với project
4. ✅ Deploy lần đầu (đang chạy nhưng thiếu env variables)

## 🔧 Cần làm tiếp:

### Cách 1: Set env variables qua Railway Dashboard (KHUYẾN NGHỊ)

1. Vào: https://railway.com/project/523d93c6-9469-4c6f-9755-9b8ddb276d81
2. Click vào service **order-service**
3. Vào tab **Variables**
4. Click **+ New Variable**
5. Thêm từng biến sau:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://loivinh759:602057Aa@cluster0.228w4d1.mongodb.net/restaurant-orders?retryWrites=true&w=majority` |
| `JWT_SECRET` | `supersecretkey` |
| `GUEST_CUSTOMER_ID` | `68dd5f25e860b3125ac6329c` |
| `CUSTOMER_SERVICE_URL` | `https://customer-service-production-ec02.up.railway.app` |
| `MENU_SERVICE_URL` | `https://menu-service-production-0211.up.railway.app` |
| `INVENTORY_SERVICE_URL` | `http://localhost:5004` |
| `TABLE_SERVICE_URL` | `http://localhost:5006` |
| `DEFAULT_DELIVERY_FEE` | `30000` |
| `FREE_DELIVERY_THRESHOLD` | `500000` |
| `TAX_RATE` | `0.08` |
| `CASSO_API_KEY` | `AK_CS.89dbcb50a20311f0b3608384b1ba5c12.lgot4rcrXdOZscSPMHEnG9bEIjdFEgYNtVns0cr1C4vaZQ6RKbjJIFxXEqnjSSxu3d8em1am` |

6. Sau khi thêm xong, Railway sẽ tự động redeploy
7. Đợi deploy xong (2-3 phút)
8. Lấy URL từ Railway Dashboard → Settings → Networking → Public Domain

## 📝 Lưu ý:
- Service đã được deploy nhưng thiếu env variables nên sẽ không chạy được
- Sau khi set env variables, service sẽ tự động restart với env mới
- Lấy Railway URL để update vào frontend env variables

