# Hướng Dẫn Sử Dụng Tính Năng Đặt Lại Mật Khẩu

## Dành Cho Người Dùng Cuối

### Cách Sử Dụng

#### Bước 1: Truy Cập Trang Quên Mật Khẩu
1. Vào trang đăng nhập (`/login`)
2. Click vào link **"Quên mật khẩu?"** ở dưới ô nhập mật khẩu
3. Hoặc truy cập trực tiếp: `/forgot-password`

#### Bước 2: Nhập Email
1. Nhập email đã đăng ký tài khoản của bạn
2. Click nút **"Gửi mã OTP"**
3. Đợi vài giây, bạn sẽ nhận được email chứa mã OTP 6 số
4. ⚠️ **Lưu ý:** Kiểm tra cả thư mục Spam nếu không thấy email

#### Bước 3: Nhập Mã OTP
1. Mở email và tìm mã OTP 6 số (ví dụ: `123456`)
2. Nhập từng số vào 6 ô tương ứng trên trang web
3. Các ô sẽ tự động chuyển sang ô tiếp theo khi bạn nhập
4. Click nút **"Xác thực OTP"**
5. ⚠️ **Lưu ý:** 
   - Mã OTP chỉ hiệu lực trong **10 phút**
   - Bạn có **5 lần thử** để nhập đúng mã
   - Nếu hết lần thử hoặc hết hạn, click **"Gửi lại mã OTP"** (sau 60 giây)

#### Bước 4: Đặt Mật Khẩu Mới
1. Nhập mật khẩu mới (tối thiểu 6 ký tự)
2. Nhập lại mật khẩu để xác nhận
3. Click nút **"Đặt lại mật khẩu"**
4. Sau khi thành công, bạn sẽ được chuyển về trang đăng nhập
5. Đăng nhập với mật khẩu mới

## Lưu Ý Quan Trọng

### Bảo Mật
- ⚠️ **KHÔNG BAO GIỜ** chia sẻ mã OTP với ai khác
- Mã OTP chỉ hiệu lực trong 10 phút
- Mỗi mã OTP chỉ được sử dụng 1 lần
- Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email

### Thời Gian
- OTP hiệu lực: **10 phút**
- Reset token hiệu lực: **5 phút** (sau khi verify OTP)
- Thời gian đếm ngược gửi lại OTP: **60 giây**

### Giới Hạn
- Số lần thử OTP tối đa: **5 lần**
- Sau 5 lần thử sai, bạn phải yêu cầu mã OTP mới

## Xử Lý Sự Cố

### Không Nhận Được Email
1. Kiểm tra thư mục **Spam/Junk Mail**
2. Kiểm tra email đã nhập có đúng không
3. Đợi thêm vài phút (email có thể đến chậm)
4. Click **"Gửi lại mã OTP"** sau 60 giây

### Mã OTP Không Đúng
1. Kiểm tra lại mã OTP trong email
2. Đảm bảo nhập đủ 6 số
3. Nếu đã thử nhiều lần, yêu cầu mã OTP mới

### Mã OTP Hết Hạn
1. Click **"Gửi lại mã OTP"**
2. Đợi 60 giây nếu nút chưa sẵn sàng
3. Nhập email lại và gửi mã mới

### Quên Email Đã Đăng Ký
- Liên hệ với bộ phận hỗ trợ khách hàng
- Cung cấp thông tin để xác minh danh tính

## Giao Diện

### Progress Indicator
Trang sẽ hiển thị thanh tiến trình với 3 bước:
1. ✅ Nhập email (Bước 1/3)
2. ✅ Nhập OTP (Bước 2/3)
3. ✅ Mật khẩu mới (Bước 3/3)

### Thông Báo
- **Thành công:** Hiển thị màu xanh lá
- **Lỗi:** Hiển thị màu đỏ với message rõ ràng
- **Thông tin:** Hiển thị màu xanh dương

## Liên Hệ Hỗ Trợ

Nếu gặp vấn đề, vui lòng liên hệ:
- Email: support@restaurant.com
- Hotline: 1900-xxxx
- Hoặc qua trang liên hệ trên website

