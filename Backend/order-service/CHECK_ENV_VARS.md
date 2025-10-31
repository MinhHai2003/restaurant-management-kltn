# 🔍 Kiểm tra Environment Variables cho Order Service trên Railway

## ⚠️ Lỗi 500 khi tạo order

Order service cần các env variables sau để kết nối với các services khác:

### Environment Variables cần thiết:

```
MENU_SERVICE_URL=https://menu-service-production-0211.up.railway.app
CUSTOMER_SERVICE_URL=https://customer-service-production-ec02.up.railway.app
INVENTORY_SERVICE_URL=https://inventory-service-production-01a2.up.railway.app
TABLE_SERVICE_URL=https://table-service1.onrender.com
MONGODB_URI=mongodb+srv://loivinh759:602057Aa@cluster0.228w4d1.mongodb.net/restaurant-orders?retryWrites=true&w=majority
JWT_SECRET=supersecretkey
```

### Cách kiểm tra trên Railway:

1. Vào Railway Dashboard
2. Chọn project chứa `order-service`
3. Click vào service `order-service`
4. Vào tab **"Variables"**
5. Kiểm tra các biến trên có đầy đủ không

### Lỗi thường gặp:

- ❌ **MENU_SERVICE_URL không đúng** → Không validate được menu items → 500 error
- ❌ **INVENTORY_SERVICE_URL không đúng** → Không check được inventory → 500 error
- ❌ **CUSTOMER_SERVICE_URL không đúng** → Không validate được customer → 500 error
- ❌ **MONGODB_URI sai** → Không lưu được order → 500 error

### Kiểm tra logs:

1. Vào Railway Dashboard → order-service → **"Deployments"** → Click vào deployment mới nhất
2. Xem **"Logs"** để tìm lỗi cụ thể
3. Tìm các dòng có `[ERROR]` hoặc `Error:`

### Test các services:

```bash
# Test menu service
curl https://menu-service-production-0211.up.railway.app/api/menu

# Test customer service  
curl https://customer-service-production-ec02.up.railway.app/health

# Test inventory service
curl https://inventory-service-production-01a2.up.railway.app/api/inventory
```

