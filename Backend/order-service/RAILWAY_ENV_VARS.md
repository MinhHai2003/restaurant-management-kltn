# Order Service - Environment Variables for Railway

## Required Environment Variables:

```
MONGODB_URI=mongodb+srv://loivinh759:602057Aa@cluster0.228w4d1.mongodb.net/restaurant-orders?retryWrites=true&w=majority
JWT_SECRET=supersecretkey
CUSTOMER_SERVICE_URL=https://customer-service-production-ec02.up.railway.app
MENU_SERVICE_URL=https://menu-service-production-0211.up.railway.app
INVENTORY_SERVICE_URL=http://localhost:5004
```

## Notes:
- `INVENTORY_SERVICE_URL` tạm thời để localhost vì chưa deploy inventory-service
- Sau khi deploy inventory-service, cần update URL này

