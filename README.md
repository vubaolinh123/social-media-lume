# LUMÉ LASHES Social Media Manager

Ứng dụng Express + EJS để:
- Upload ảnh sản phẩm
- Tạo ảnh template AI bám theo ảnh gốc (product-reference)
- Tạo caption AI
- Quản lý gallery ảnh gốc/ảnh AI
- Đăng Facebook/Instagram theo từng item

## 1) Yêu cầu môi trường

- Node.js 18+
- MongoDB chạy local hoặc remote

## 2) Cài đặt

```bash
npm install
```

Tạo file `.env` từ `.env.example` và điền các giá trị cần thiết.

Biến quan trọng mới:

- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_COOKIE_NAME`
- `APP_CONFIG_SECRET` (dùng mã hóa token/api key lưu trong DB)

Lưu ý: Gemini token/model, Facebook/Instagram/Telegram token, Brand info được cấu hình trong trang `/settings` theo từng user (không còn phụ thuộc .env).

## 3) Seed tài khoản admin mẫu

```bash
npm run seed:admin
```

Thông tin đăng nhập mẫu:
- Username: `admin`
- Password: `admin@123`

## 4) Chạy ứng dụng

```bash
npm run dev
# hoặc
npm run start
```

Mặc định vào route `/login` để đăng nhập trước khi dùng các route nghiệp vụ.

## 5) Gallery workflow

Route chính:
- `GET /gallery` — hiển thị side-by-side ảnh gốc và ảnh AI

Actions per item:
- `POST /api/posts/:postId/publish/facebook`
- `POST /api/posts/:postId/publish/instagram`
- `DELETE /api/posts/:postId` (xóa cả ảnh gốc + ảnh AI + record DB)

## 6) AI prompt rules

Prompt image generation đã bổ sung invariant:
- ảnh AI giữ identity sản phẩm theo ảnh upload
- không được invent sản phẩm mới
- màu sắc/layout derive từ ảnh gốc, không ép tông tối
- phân tích màu logo LUMÉ LASHES để tránh layout quá sáng/chói hoặc quá tối

Footer SĐT/địa chỉ: do AI tự gen trong ảnh (hệ thống không overlay text footer bằng Sharp nữa để tránh bị đè 2 lần).

Tạo ảnh theo chế độ 1 attempt / 1 kết quả để giảm latency.

## 7) Chạy test

```bash
npm test
```

Hoặc chạy nhanh bộ test chính:

```bash
node --test test/auth/login-flow.test.js test/auth/seed-admin-login.test.js test/auth/guard.test.js test/posts/persistence.test.js test/posts/delete-cascade-contract.test.js test/ai/prompt-policy.test.js test/ai/non-dark-palette-policy.test.js test/ai/retry-threshold.test.js test/ai/similarity-hard-fail.test.js test/gallery/render-side-by-side.test.js test/gallery/actions-buttons.test.js test/gallery/publish-facebook.test.js test/gallery/publish-instagram-autoflow.test.js test/gallery/delete-item.test.js
```
