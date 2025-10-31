# Order Service - Set Environment Variables on Railway

## Các bước:

1. Vào Railway Dashboard: https://railway.com/project/523d93c6-9469-4c6f-9755-9b8ddb276d81
2. Click vào service **order-service**
3. Vào tab **Variables**
4. Thêm các biến sau:

### Environment Variables:

```
MONGODB_URI=mongodb+srv://loivinh759:602057Aa@cluster0.228w4d1.mongodb.net/restaurant-orders?retryWrites=true&w=majority
JWT_SECRET=supersecretkey
GUEST_CUSTOMER_ID=68dd5f25e860b3125ac6329c
CUSTOMER_SERVICE_URL=https://customer-service-production-ec02.up.railway.app
MENU_SERVICE_URL=https://menu-service-production-0211.up.railway.app
INVENTORY_SERVICE_URL=http://localhost:5004
TABLE_SERVICE_URL=http://localhost:5006
DEFAULT_DELIVERY_FEE=30000
FREE_DELIVERY_THRESHOLD=500000
TAX_RATE=0.08
CASSO_API_KEY=AK_CS.89dbcb50a20311f0b3608384b1ba5c12.lgot4rcrXdOZscSPMHEnG9bEIjdFEgYNtVns0cr1C4vaZQ6RKbjJIFxXEqnjSSxu3d8em1am
```

## Lưu ý:
- Sau khi set env variables, service sẽ tự động redeploy
- Sau khi deploy xong, lấy URL từ Railway Dashboard để update frontend

