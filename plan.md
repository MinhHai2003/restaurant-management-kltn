# Hệ thống Đánh giá Món ăn và Phân tích AI

## Tổng quan
Xây dựng tính năng đánh giá món ăn với tiêu chuẩn 5 sao và hệ thống phân tích thông minh:
- **Đánh giá từng món ăn**: Khách hàng đánh giá 1-5 sao cho mỗi món trong đơn hàng đã hoàn thành
- **Phân tích dữ liệu**: Thống kê món ăn được đánh giá cao nhất
- **Gợi ý cá nhân hóa**: Hiển thị món khách hàng hay đặt và món được đánh giá cao khi đăng nhập

## Backend Implementation

### 1. Tạo Review Model
**File**: `Backend/order-service/models/Review.js` (mới)

Tạo model lưu đánh giá chi tiết cho từng món ăn:
```javascript
{
  orderId: ObjectId,
  orderNumber: String,
  customerId: ObjectId,
  customerName: String,
  menuItemId: ObjectId,
  menuItemName: String,
  rating: Number (1-5),
  comment: String (optional),
  images: [String] (optional - ảnh món ăn khách chụp),
  ratedAt: Date,
  orderDate: Date (để phân tích theo thời gian)
}
```

Indexes:
- `menuItemId` + `rating` (tìm món đánh giá cao)
- `customerId` + `createdAt` (lịch sử đánh giá)
- `orderId` (kiểm tra đã đánh giá chưa)

### 2. Cập nhật Order Model
**File**: `Backend/order-service/models/Order.js`

Thêm field tracking đánh giá:
```javascript
// Thay thế ratings hiện tại (dòng 227-245)
itemRatings: {
  isRated: { type: Boolean, default: false },
  ratedAt: Date,
  reviewIds: [{ type: ObjectId, ref: 'Review' }]
}
```

Thêm method:
```javascript
OrderSchema.methods.canRateItems = function() {
  return ['completed', 'delivered'].includes(this.status) && !this.itemRatings.isRated;
}
```

### 3. Tạo Review Controller
**File**: `Backend/order-service/controllers/reviewController.js` (mới)

**API Endpoints:**

1. `POST /api/reviews/order/:orderNumber` - Tạo đánh giá cho các món trong order
   - Input: `{ items: [{ menuItemId, rating, comment?, images? }] }`
   - Validate: Order phải completed và chưa được đánh giá
   - Tạo Review cho mỗi món
   - Cập nhật MenuItem ratings statistics
   - Cập nhật Order.itemRatings.isRated = true

2. `GET /api/reviews/customer/my-reviews` - Lấy lịch sử đánh giá của customer
   - Trả về danh sách reviews với thông tin món ăn

3. `GET /api/reviews/menu-item/:menuItemId` - Lấy reviews của 1 món ăn
   - Phân trang
   - Sắp xếp theo rating/date

4. `GET /api/reviews/top-rated` - Top món ăn đánh giá cao nhất
   - Aggregate: Tính average rating, số lượng reviews
   - Filter: Chỉ món có ít nhất 5 reviews
   - Sort: Theo average rating DESC
   - Limit: 10 món

5. `GET /api/reviews/customer/recommendations` - Gợi ý cho customer
   - Phân tích món hay đặt nhất (top 5)
   - Món được đánh giá cao trong category yêu thích
   - Món mới chưa thử

### 4. Cập nhật MenuItem Model
**File**: `Backend/menu-service/models/MenuItem.js`

Thêm statistics fields:
```javascript
ratings: {
  average: { type: Number, default: 0, min: 0, max: 5 },
  count: { type: Number, default: 0 },
  distribution: {
    star5: { type: Number, default: 0 },
    star4: { type: Number, default: 0 },
    star3: { type: Number, default: 0 },
    star2: { type: Number, default: 0 },
    star1: { type: Number, default: 0 }
  }
},
orderCount: { type: Number, default: 0 }
```

### 5. Tạo Analytics Service
**File**: `Backend/order-service/services/analyticsService.js` (mới)

Functions:
- `getCustomerFavoriteItems(customerId)` - Top 5 món hay đặt
- `getCustomerRecommendations(customerId)` - Gợi ý thông minh
- `getTopRatedItems(limit = 10)` - Món đánh giá cao nhất
- `updateMenuItemRatings(menuItemId)` - Cập nhật statistics

### 6. Tích hợp vào Order Routes
**File**: `Backend/order-service/routes/orderRoutes.js`

Thêm routes:
```javascript
const reviewController = require('../controllers/reviewController');

router.post('/reviews/order/:orderNumber', authenticateCustomer, reviewController.createReview);
router.get('/reviews/customer/my-reviews', authenticateCustomer, reviewController.getMyReviews);
router.get('/reviews/menu-item/:menuItemId', reviewController.getMenuItemReviews);
router.get('/reviews/top-rated', reviewController.getTopRated);
router.get('/reviews/customer/recommendations', authenticateCustomer, reviewController.getRecommendations);
```

## Frontend Implementation

### 7. Tạo Rating Component
**File**: `Fontend/my-restaurant-app/src/components/RatingStars.tsx` (mới)

Component hiển thị và chọn rating 1-5 sao:
- Props: `value`, `onChange`, `readonly`, `size`
- Hiển thị sao đầy/rỗng
- Click để chọn rating (nếu không readonly)

### 8. Tạo Order Rating Modal
**File**: `Fontend/my-restaurant-app/src/components/OrderRatingModal.tsx` (mới)

Modal đánh giá đơn hàng:
- Hiển thị danh sách món trong order
- Mỗi món có: Ảnh, tên, RatingStars component, textarea comment
- Button "Gửi đánh giá"
- Call API POST `/api/reviews/order/:orderNumber`

### 9. Cập nhật Orders Page
**File**: `Fontend/my-restaurant-app/src/pages/account/OrdersPage.tsx`

Thêm nút "Đánh giá" cho orders đã completed và chưa đánh giá:
- Kiểm tra `order.itemRatings.isRated`
- Show badge "Đã đánh giá" hoặc button "Đánh giá ngay"
- Mở OrderRatingModal khi click

### 10. Tạo Recommendations Page
**File**: `Fontend/my-restaurant-app/src/pages/RecommendationsPage.tsx` (mới)

Trang hiển thị gợi ý cá nhân hóa:

**Section 1: "Món bạn yêu thích"**
- Gọi API `/api/reviews/customer/recommendations`
- Hiển thị top 5 món hay đặt với số lần đặt
- Card: Ảnh, tên, số lần đặt, rating trung bình

**Section 2: "Món được đánh giá cao nhất"**
- Gọi API `/api/reviews/top-rated`
- Grid cards với rating average, số reviews
- Badge "Top rated" cho món rating >= 4.5

**Section 3: "Món bạn đã đánh giá"**
- Gọi API `/api/reviews/customer/my-reviews`
- Hiển thị lịch sử đánh giá của mình
- Có thể xem lại comment

### 11. Cập nhật Navigation
**File**: `Fontend/my-restaurant-app/src/components/account/AccountLayout.tsx`

Thêm menu item:
```javascript
{ id: 'recommendations', label: 'Gợi ý cho bạn', icon: '⭐', path: '/profile/recommendations' }
```

### 12. Tạo Review Service
**File**: `Fontend/my-restaurant-app/src/services/reviewService.ts` (mới)

API functions:
- `submitOrderReview(orderNumber, items)`
- `getMyReviews()`
- `getMenuItemReviews(menuItemId)`
- `getTopRated()`
- `getRecommendations()`

### 13. Hiển thị Rating trên Menu
**File**: `Fontend/my-restaurant-app/src/pages/MenuPage.tsx`

Thêm hiển thị rating cho mỗi món:
- Stars component (readonly)
- Text: "4.5 ⭐ (128 đánh giá)"
- Badge "Top rated" nếu rating >= 4.5

## Database Updates

### Indexes cần tạo
```javascript
// Review collection
db.reviews.createIndex({ menuItemId: 1, rating: -1 })
db.reviews.createIndex({ customerId: 1, createdAt: -1 })
db.reviews.createIndex({ orderId: 1 })

// Order collection - thêm index cho phân tích
db.orders.createIndex({ customerId: 1, status: 1, orderDate: -1 })
db.orders.createIndex({ "items.menuItemId": 1 })
```

## Thống kê và Analytics

### Query Examples

**Top món hay đặt của customer:**
```javascript
Order.aggregate([
  { $match: { customerId: ObjectId(id), status: { $in: ['completed', 'delivered'] } }},
  { $unwind: '$items' },
  { $group: { 
      _id: '$items.menuItemId', 
      name: { $first: '$items.name' },
      count: { $sum: '$items.quantity' },
      totalSpent: { $sum: { $multiply: ['$items.price', '$items.quantity'] }}
  }},
  { $sort: { count: -1 }},
  { $limit: 5 }
])
```

**Top rated items:**
```javascript
MenuItem.find({ 'ratings.count': { $gte: 5 }})
  .sort({ 'ratings.average': -1 })
  .limit(10)
```

## Testing Checklist

1. Đặt hàng và hoàn thành order
2. **Kiểm tra chỉ đơn hàng "delivered" mới được đánh giá**
3. Đánh giá các món trong order (1-5 sao + comment)
4. Kiểm tra không thể đánh giá lại
5. Xem lịch sử đánh giá của mình
6. Xem trang gợi ý - hiển thị món hay đặt
7. Xem top rated items trên trang gợi ý
8. Kiểm tra rating hiển thị đúng trên menu page
9. Đặt nhiều món khác nhau và kiểm tra thống kê
10. **Kiểm tra logic "Món yêu thích": rating >= 3 và orderCount >= 1**

## To-dos

- [ ] Tạo Review model trong order-service với đầy đủ fields và indexes
- [ ] Cập nhật Order model thêm itemRatings tracking và canRateItems method
- [ ] Cập nhật MenuItem model thêm ratings statistics và orderCount
- [ ] Tạo analyticsService.js với các functions phân tích dữ liệu
- [ ] Tạo reviewController với 5 API endpoints cho rating và recommendations
- [ ] Thêm review routes vào order-service
- [ ] Tạo RatingStars component cho frontend
- [ ] Tạo OrderRatingModal component để đánh giá order
- [ ] Thêm nút đánh giá vào OrdersPage
- [ ] Tạo RecommendationsPage hiển thị gợi ý và top rated
- [ ] Tạo reviewService.ts cho API calls
- [ ] Hiển thị rating trên MenuPage
- [ ] Thêm Recommendations vào AccountLayout navigation